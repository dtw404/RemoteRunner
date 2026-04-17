from pydantic import BaseModel
from typing import Optional
from enum import Enum


class RunRequest(BaseModel):
    devices: list[str]
    command: str
    username: str
    password: str


class DeviceResult(BaseModel):
    device: str
    status: bool
    output: str
    error: Optional[str]
    duration_ms: int


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE = "done"


class Job(BaseModel):
    job_id: str
    status: JobStatus
    results: list[DeviceResult] = []
