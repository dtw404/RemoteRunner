# RemoteRunner

Mission-control UI for running commands on remote devices over SSH in parallel, with real-time WebSocket streaming output.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Terminal output | xterm.js |
| Command input | Monaco Editor |
| Backend | FastAPI (Python 3.11) |
| SSH | asyncssh |
| Realtime | WebSockets |

## Quick Start

### Backend

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Or use the helper scripts from the repo root:
```bash
bash start-backend.sh   # terminal 1
bash start-frontend.sh  # terminal 2
```

## API

| Method | Path | Description |
|---|---|---|
| POST | `/run` | Start a job, returns `{ job_id }` |
| WS | `/ws/{job_id}` | Stream real-time output |
| GET | `/results/{job_id}` | Fetch final structured results |

### POST /run body

```json
{
  "devices": ["host1", "host2"],
  "command": "show version",
  "username": "admin",
  "password": "secret"
}
```

## Project Structure

```
RemoteRunner/
├── backend/
│   ├── app.py          # FastAPI routes + WebSocket
│   ├── executor.py     # Job store + async orchestration
│   ├── ssh_async.py    # asyncssh wrapper
│   ├── models.py       # Pydantic models
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── Terminal.jsx       # xterm.js
        │   ├── DeviceInput.jsx    # device list + credentials
        │   ├── CommandEditor.jsx  # Monaco Editor
        │   ├── StatusSidebar.jsx  # animated device nodes
        │   └── ResultsTable.jsx   # results + export
        ├── services/api.js
        └── hooks/useWebSocket.js
```
