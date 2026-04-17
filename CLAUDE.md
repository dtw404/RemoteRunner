# RemoteRunner — AI Assistant Context

## Project Summary

RemoteRunner is a mission-control web app for executing shell commands on multiple remote devices in parallel over SSH, with real-time streaming output. A React + Vite frontend communicates with a Python FastAPI backend. Commands are dispatched to N devices concurrently using `asyncio.gather()`, output is streamed live via WebSockets, and SSH credentials are stored securely in Windows Credential Manager.

---

## Repository Layout

```
RemoteRunner/
├── backend/
│   ├── app.py            # FastAPI app — REST + WebSocket endpoints
│   ├── models.py         # Pydantic data models
│   ├── executor.py       # Job store + async orchestration
│   ├── ssh_async.py      # asyncssh SSH wrapper
│   ├── credentials.py    # Windows Credential Manager integration
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx                      # Root component, orchestrates all state
│   │   ├── main.jsx                     # React entry point
│   │   ├── index.css                    # Global styles
│   │   ├── components/
│   │   │   ├── DeviceInput.jsx          # Device list + credential selector
│   │   │   ├── CommandEditor.jsx        # Monaco code editor for commands
│   │   │   ├── Terminal.jsx             # xterm.js live output display
│   │   │   ├── StatusSidebar.jsx        # Per-device status nodes
│   │   │   └── ResultsTable.jsx         # Final results table + CSV export
│   │   ├── services/
│   │   │   └── api.js                   # fetch() wrappers for all HTTP endpoints
│   │   └── hooks/
│   │       └── useWebSocket.js          # Custom hook for WS://{job_id} streaming
│   ├── vite.config.js    # Dev server (port 3000) + proxy to localhost:8000
│   └── package.json      # npm dependencies
├── start-backend.sh      # Create venv, pip install, uvicorn on :8000
└── start-frontend.sh     # npm install + Vite dev server on :3000
```

---

## Architecture

```
Browser (localhost:3000)
  │
  │  HTTP POST /run          → returns job_id
  │  HTTP GET  /results/{id} → final results array
  │  WS        /ws/{id}      → real-time output chunks
  │  HTTP CRUD /credentials  → credential profile management
  │
FastAPI (localhost:8000)
  │
  ├── app.py         routes incoming requests
  │     └── executor.py   creates Job, runs execute_job() as asyncio.Task
  │           └── ssh_async.py   asyncssh.connect() per device (timeout=10s)
  │
  ├── asyncio.gather(*tasks)  — all devices run in parallel
  │
  ├── on_chunk() callback → _broadcast() → per-job asyncio.Queue
  │     └── WebSocket handler drains queue, forwards to browser in real-time
  │
  └── credentials.py   keyring ↔ Windows Credential Manager
        manifest: ~/.remoterunner/credentials.json (names + SSH usernames only)
```

---

## Python Backend Dependencies

### `backend/requirements.txt`

| Package | Version | Role |
|---------|---------|------|
| `fastapi` | 0.111.0 | Web framework; REST endpoints + WebSocket |
| `uvicorn[standard]` | 0.29.0 | ASGI server (runs `app.py`) |
| `asyncssh` | 2.14.2 | Async SSH client — `asyncssh.connect()`, `conn.run()` |
| `pydantic` | 2.7.1 | Data validation; `RunRequest`, `DeviceResult`, `Job` models |
| `websockets` | 12.0 | WebSocket protocol support used by uvicorn/fastapi |
| `keyring` | 25.2.1 | OS keychain integration — Windows Credential Manager |

### Standard Library Modules Used

| Module | Where used |
|--------|-----------|
| `asyncio` | `app.py`, `executor.py` — task creation, Queue, gather, wait_for |
| `json` | `app.py`, `credentials.py` — serialization |
| `uuid` | `executor.py` — job ID generation (`uuid.uuid4()`) |
| `time` | `ssh_async.py` — `time.monotonic()` for duration_ms |
| `typing` | `executor.py`, `ssh_async.py`, `credentials.py` — `Optional`, `Callable`, `Any` |
| `pathlib.Path` | `credentials.py` — manifest file path (`Path.home() / ".remoterunner"`) |
| `enum.Enum` | `models.py` — `JobStatus(str, Enum)` |

---

## Frontend Dependencies

### `frontend/package.json`

| Package | Version | Role |
|---------|---------|------|
| `react` | ^18.3.1 | UI framework |
| `react-dom` | ^18.3.1 | DOM rendering |
| `@monaco-editor/react` | ^4.6.0 | VS Code-style command editor (`CommandEditor.jsx`) |
| `xterm` | ^5.3.0 | Terminal emulator for live output (`Terminal.jsx`) |
| `xterm-addon-fit` | ^0.8.0 | Auto-resize xterm canvas to container |
| `xterm-addon-web-links` | ^0.9.0 | Clickable URLs in terminal output |

### Dev Dependencies

| Package | Version | Role |
|---------|---------|------|
| `vite` | ^5.2.11 | Build tool + HMR dev server |
| `@vitejs/plugin-react` | ^4.3.1 | JSX transform + React fast-refresh |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/run` | Submit job. Body: `RunRequest`. Returns `{job_id}`. |
| `GET` | `/results/{job_id}` | Returns `[DeviceResult]` array when job is done. |
| `WS` | `/ws/{job_id}` | Streams `{type:"output", device, chunk}` messages; ends with `{type:"done", results}`. |
| `GET` | `/credentials` | List profiles as `[{name, username}]` — no passwords. |
| `POST` | `/credentials` | Save/overwrite a profile. Body: `{name, username, password}`. |
| `GET` | `/credentials/{name}` | Decrypt and return `{username, password}`. |
| `DELETE` | `/credentials/{name}` | Remove profile from WCM and manifest. |

---

## Data Models (`backend/models.py`)

```python
class RunRequest(BaseModel):
    devices: list[str]   # hostnames / IPs
    command: str
    username: str
    password: str

class DeviceResult(BaseModel):
    device: str
    status: bool         # True = success (exit 0, no errors)
    output: str          # stdout + [STDERR] lines joined
    error: Optional[str] # None on success; error message otherwise
    duration_ms: int

class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    DONE    = "done"

class Job(BaseModel):
    job_id: str
    status: JobStatus
    results: list[DeviceResult] = []
```

---

## Key Implementation Patterns

### Parallel SSH execution
```python
# executor.py — all devices fire simultaneously
results = await asyncio.gather(*[
    run_ssh_command(device, command, username, password, on_chunk)
    for device in devices
])
```

### Real-time streaming (pub/sub)
```python
# subscribe() returns a per-WebSocket asyncio.Queue
# on_chunk() callback calls _broadcast() → q.put_nowait(msg)
# WebSocket handler: msg = await asyncio.wait_for(q.get(), timeout=30)
```

### SSH connection (ssh_async.py)
```python
async with asyncssh.connect(
    device, username=username, password=password,
    known_hosts=None, connect_timeout=10
) as conn:
    result = await conn.run(command, check=False)
```
- `known_hosts=None` skips host key verification
- `connect_timeout=10` — 10-second hard limit per device
- Errors caught: `asyncssh.DisconnectError`, `asyncssh.PermissionDenied`, `OSError`, `asyncssh.Error`

### Credential storage (credentials.py)
```python
SERVICE = "RemoteRunner"
# Store:   keyring.set_password(SERVICE, profile_name, json_payload)
# Retrieve: keyring.get_password(SERVICE, profile_name)
# Delete:  keyring.delete_password(SERVICE, profile_name)
# Manifest: ~/.remoterunner/credentials.json → [{name, username}] (no passwords)
```

---

## Dev Workflow

```bash
# Backend (Python 3.11+)
bash start-backend.sh
# → creates .venv, pip install -r backend/requirements.txt, uvicorn backend.app:app --reload --port 8000

# Frontend (Node 18+)
bash start-frontend.sh
# → npm install, vite dev server on port 3000
# → vite.config.js proxies /api and /ws to http://localhost:8000
```

Both servers must be running for the app to function. Frontend hot-reloads on save; backend reloads on Python file changes.

---

## Error Handling Reference

| Scenario | Where handled | Behaviour |
|----------|--------------|-----------|
| No devices in request | `app.py /run` | HTTP 400 |
| Job ID not found | `app.py /ws`, `/results` | WS close 4004 / HTTP 404 |
| SSH disconnect | `ssh_async.py` | `error_text` set; `[ERROR]` chunk streamed |
| Bad credentials | `ssh_async.py` | `PermissionDenied` caught; error streamed |
| Non-zero exit code | `ssh_async.py` | `status=False`; error = "Exit code: N" |
| WebSocket idle 30s | `app.py /ws` | Sends `{type:"ping"}` to keep connection alive |
| Profile not in WCM | `credentials.py` | Returns `None`; app.py raises HTTP 404 |
