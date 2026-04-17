import asyncio
import uuid
from typing import Any

from models import Job, JobStatus, DeviceResult
from ssh_async import run_ssh_command

# In-memory job store
_jobs: dict[str, Job] = {}

# Per-job WebSocket subscribers: job_id → list of asyncio.Queue
_subscribers: dict[str, list[asyncio.Queue]] = {}


def create_job() -> str:
    job_id = str(uuid.uuid4())
    _jobs[job_id] = Job(job_id=job_id, status=JobStatus.PENDING)
    _subscribers[job_id] = []
    return job_id


def get_job(job_id: str) -> Job | None:
    return _jobs.get(job_id)


def subscribe(job_id: str) -> asyncio.Queue:
    q: asyncio.Queue = asyncio.Queue()
    _subscribers.setdefault(job_id, []).append(q)
    return q


def unsubscribe(job_id: str, q: asyncio.Queue) -> None:
    subs = _subscribers.get(job_id, [])
    if q in subs:
        subs.remove(q)


def _broadcast(job_id: str, msg: dict[str, Any]) -> None:
    for q in _subscribers.get(job_id, []):
        q.put_nowait(msg)


async def execute_job(
    job_id: str,
    devices: list[str],
    command: str,
    username: str,
    password: str,
) -> None:
    job = _jobs[job_id]
    job.status = JobStatus.RUNNING

    def on_chunk(device: str, chunk: str) -> None:
        _broadcast(job_id, {"type": "output", "device": device, "chunk": chunk})

    tasks = [
        run_ssh_command(device, command, username, password, on_chunk)
        for device in devices
    ]

    results: list[DeviceResult] = await asyncio.gather(*tasks)

    job.results = results
    job.status = JobStatus.DONE

    _broadcast(job_id, {"type": "done", "results": [r.model_dump() for r in results]})
