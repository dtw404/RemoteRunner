import asyncio
import time
from typing import Callable, Optional
import asyncssh

from models import DeviceResult


async def run_ssh_command(
    device: str,
    command: str,
    username: str,
    password: str,
    on_chunk: Optional[Callable[[str, str], None]] = None,
) -> DeviceResult:
    start = time.monotonic()
    output_parts = []
    error_text = None

    try:
        async with asyncssh.connect(
            device,
            username=username,
            password=password,
            known_hosts=None,
            connect_timeout=10,
        ) as conn:
            result = await conn.run(command, check=False)

            stdout = result.stdout or ""
            stderr = result.stderr or ""

            if stdout:
                output_parts.append(stdout)
                if on_chunk:
                    on_chunk(device, stdout)

            if stderr:
                output_parts.append(f"[STDERR] {stderr}")
                if on_chunk:
                    on_chunk(device, f"[STDERR] {stderr}")

            if result.exit_status != 0:
                error_text = f"Exit code: {result.exit_status}"

    except asyncssh.DisconnectError as e:
        error_text = f"SSH disconnect: {e}"
        if on_chunk:
            on_chunk(device, f"[ERROR] {error_text}")
    except asyncssh.PermissionDenied:
        error_text = "Permission denied (bad credentials)"
        if on_chunk:
            on_chunk(device, f"[ERROR] {error_text}")
    except (OSError, asyncssh.Error) as e:
        error_text = str(e)
        if on_chunk:
            on_chunk(device, f"[ERROR] {error_text}")

    duration_ms = int((time.monotonic() - start) * 1000)

    return DeviceResult(
        device=device,
        status=error_text is None,
        output="\n".join(output_parts),
        error=error_text,
        duration_ms=duration_ms,
    )
