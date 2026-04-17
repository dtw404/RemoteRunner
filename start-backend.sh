#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/backend"

if [ ! -d ".venv" ]; then
  python3.11 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
