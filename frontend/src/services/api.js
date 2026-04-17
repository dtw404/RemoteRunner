const BASE = "";

// ── Credential Manager ────────────────────────────────────────────────────────

export async function listCredentials() {
  const res = await fetch(`${BASE}/credentials`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // [{name, username}]
}

export async function saveCredential(name, username, password) {
  const res = await fetch(`${BASE}/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function loadCredential(name) {
  const res = await fetch(`${BASE}/credentials/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json(); // {username, password}
}

export async function deleteCredential(name) {
  const res = await fetch(`${BASE}/credentials/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── SSH execution ─────────────────────────────────────────────────────────────

export async function runCommand({ devices, command, username, password }) {
  const res = await fetch(`${BASE}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ devices, command, username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json(); // { job_id }
}

export async function fetchResults(jobId) {
  const res = await fetch(`${BASE}/results/${jobId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function exportTxt(results) {
  const lines = results.map(
    (r) =>
      `=== ${r.device} [${r.status ? "OK" : "FAIL"}] ${r.duration_ms}ms ===\n${r.output}${r.error ? `\nERROR: ${r.error}` : ""}`
  );
  download("results.txt", lines.join("\n\n"), "text/plain");
}

export function exportJson(results) {
  download("results.json", JSON.stringify(results, null, 2), "application/json");
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
