"""
Windows Credential Manager integration via the `keyring` library.

Credential profiles are stored as:
  service  = "RemoteRunner"
  username = profile name  (e.g. "datacenter-switches")
  password = JSON {"username": "...", "password": "..."}

A plaintext manifest (~/.remoterunner/credentials.json) tracks profile
names + SSH usernames so the UI can list them without decrypting secrets.
"""

import json
from pathlib import Path
from typing import Optional

import keyring
import keyring.errors

SERVICE = "RemoteRunner"
_MANIFEST = Path.home() / ".remoterunner" / "credentials.json"


# ── manifest helpers ──────────────────────────────────────────────────────────

def _load_manifest() -> list[dict]:
    if not _MANIFEST.exists():
        return []
    try:
        return json.loads(_MANIFEST.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save_manifest(entries: list[dict]) -> None:
    _MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    _MANIFEST.write_text(json.dumps(entries, indent=2), encoding="utf-8")


# ── public API ────────────────────────────────────────────────────────────────

def list_profiles() -> list[dict]:
    """Return [{name, username}] — passwords never leave WCM."""
    return _load_manifest()


def save_profile(name: str, username: str, password: str) -> None:
    """Encrypt credentials into Windows Credential Manager."""
    payload = json.dumps({"username": username, "password": password})
    keyring.set_password(SERVICE, name, payload)

    entries = [e for e in _load_manifest() if e["name"] != name]
    entries.append({"name": name, "username": username})
    _save_manifest(sorted(entries, key=lambda e: e["name"]))


def load_profile(name: str) -> Optional[dict]:
    """Decrypt and return {username, password} or None if not found."""
    payload = keyring.get_password(SERVICE, name)
    if payload is None:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def delete_profile(name: str) -> None:
    """Remove from WCM and manifest."""
    try:
        keyring.delete_password(SERVICE, name)
    except keyring.errors.PasswordDeleteError:
        pass
    entries = [e for e in _load_manifest() if e["name"] != name]
    _save_manifest(entries)
