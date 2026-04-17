import asyncio
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import RunRequest
from executor import create_job, get_job, execute_job, subscribe, unsubscribe
import credentials as cred_store

app = FastAPI(title="RemoteRunner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── SSH execution ─────────────────────────────────────────────────────────────

@app.post("/run")
async def run_command(req: RunRequest):
    devices = list({d.strip() for d in req.devices if d.strip()})
    if not devices:
        raise HTTPException(status_code=400, detail="No devices provided")

    job_id = create_job()
    asyncio.create_task(
        execute_job(job_id, devices, req.command, req.username, req.password)
    )
    return {"job_id": job_id}


@app.websocket("/ws/{job_id}")
async def ws_job(websocket: WebSocket, job_id: str):
    job = get_job(job_id)
    if not job:
        await websocket.close(code=4004)
        return

    await websocket.accept()
    q = subscribe(job_id)

    try:
        while True:
            try:
                msg = await asyncio.wait_for(q.get(), timeout=30)
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "ping"}))
                continue

            await websocket.send_text(json.dumps(msg))

            if msg.get("type") == "done":
                break
    except WebSocketDisconnect:
        pass
    finally:
        unsubscribe(job_id, q)
        await websocket.close()


@app.get("/results/{job_id}")
async def get_results(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return [r.model_dump() for r in job.results]


# ── Credential Manager ────────────────────────────────────────────────────────

class SaveCredentialRequest(BaseModel):
    name: str
    username: str
    password: str


@app.get("/credentials")
def list_credentials():
    """Return [{name, username}] — no passwords."""
    return cred_store.list_profiles()


@app.post("/credentials")
def save_credential(req: SaveCredentialRequest):
    """Save or overwrite a named credential profile in Windows Credential Manager."""
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Profile name is required")
    cred_store.save_profile(req.name.strip(), req.username, req.password)
    return {"saved": req.name.strip()}


@app.get("/credentials/{name}")
def load_credential(name: str):
    """Decrypt and return {username, password} for the named profile."""
    profile = cred_store.load_profile(name)
    if profile is None:
        raise HTTPException(status_code=404, detail="Credential profile not found")
    return profile


@app.delete("/credentials/{name}")
def delete_credential(name: str):
    """Remove a credential profile from Windows Credential Manager."""
    cred_store.delete_profile(name)
    return {"deleted": name}
