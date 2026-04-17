import React, { useState, useEffect } from "react";
import {
  listCredentials,
  saveCredential,
  loadCredential,
  deleteCredential,
} from "../services/api.js";

const s = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    height: "100%",
    minHeight: 0,
  },
  label: {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--blue-light)",
    opacity: 0.8,
    flexShrink: 0,
  },
  textarea: {
    flex: 1,
    minHeight: 0,
    background: "rgba(0,0,0,0.3)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    fontFamily: "var(--font)",
    fontSize: 12,
    padding: "8px 10px",
    resize: "none",
    outline: "none",
    lineHeight: 1.6,
    transition: "border-color 0.2s",
  },
  count: {
    fontSize: 10,
    color: "var(--text-muted)",
    textAlign: "right",
    flexShrink: 0,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    flexShrink: 0,
  },
  input: {
    background: "rgba(0,0,0,0.3)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    fontFamily: "var(--font)",
    fontSize: 12,
    padding: "6px 10px",
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
  },
  divider: {
    borderTop: "1px solid var(--border)",
    marginTop: 2,
    paddingTop: 6,
    flexShrink: 0,
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--text-muted)",
    marginBottom: 4,
  },
  profileRow: {
    display: "flex",
    gap: 5,
    alignItems: "center",
  },
  select: {
    flex: 1,
    background: "rgba(0,0,0,0.3)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    fontFamily: "var(--font)",
    fontSize: 11,
    padding: "5px 8px",
    outline: "none",
    cursor: "pointer",
  },
  btn: (accent) => ({
    background: accent ? "rgba(0,61,165,0.4)" : "rgba(0,0,0,0.3)",
    border: `1px solid ${accent ? "var(--blue-dark)" : "var(--border)"}`,
    borderRadius: 5,
    color: accent ? "var(--blue-light)" : "var(--text-muted)",
    fontFamily: "var(--font)",
    fontSize: 10,
    padding: "5px 9px",
    whiteSpace: "nowrap",
    transition: "background 0.2s, color 0.2s",
    cursor: "pointer",
  }),
  deleteBtn: {
    background: "transparent",
    border: "1px solid rgba(243,53,64,0.3)",
    borderRadius: 5,
    color: "var(--red)",
    fontFamily: "var(--font)",
    fontSize: 10,
    padding: "5px 8px",
    cursor: "pointer",
    opacity: 0.7,
    transition: "opacity 0.2s",
  },
  saveRow: {
    display: "flex",
    gap: 5,
    alignItems: "center",
    marginTop: 2,
  },
  msg: (ok) => ({
    fontSize: 10,
    color: ok ? "var(--blue-light)" : "var(--red)",
    marginTop: 2,
    flexShrink: 0,
  }),
};

function focusBorder(e) { e.target.style.borderColor = "var(--blue-light)"; }
function blurBorder(e)  { e.target.style.borderColor = "var(--border)"; }

export function DeviceInput({ onDevicesChange, credentials, onCredentialsChange }) {
  const [raw, setRaw] = useState("");
  const [profiles, setProfiles] = useState([]);        // [{name, username}]
  const [selectedProfile, setSelectedProfile] = useState("");
  const [saveName, setSaveName] = useState("");
  const [msg, setMsg] = useState(null);                // {text, ok}

  // Load profile list on mount
  useEffect(() => {
    listCredentials()
      .then(setProfiles)
      .catch(() => {});
  }, []);

  function flash(text, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 2500);
  }

  function handleDeviceChange(e) {
    const val = e.target.value;
    setRaw(val);
    const devices = [...new Set(val.split("\n").map((l) => l.trim()).filter(Boolean))];
    onDevicesChange(devices);
  }

  async function handleLoad() {
    if (!selectedProfile) return;
    try {
      const cred = await loadCredential(selectedProfile);
      onCredentialsChange({ username: cred.username, password: cred.password });
      flash(`Loaded "${selectedProfile}"`);
    } catch {
      flash("Failed to load credential", false);
    }
  }

  async function handleSave() {
    const name = saveName.trim();
    if (!name) { flash("Enter a profile name", false); return; }
    if (!credentials.username) { flash("Username is required", false); return; }
    if (!credentials.password) { flash("Password is required", false); return; }
    try {
      await saveCredential(name, credentials.username, credentials.password);
      const updated = await listCredentials();
      setProfiles(updated);
      setSelectedProfile(name);
      setSaveName("");
      flash(`Saved "${name}" to Windows Credential Manager`);
    } catch (e) {
      flash(e.message, false);
    }
  }

  async function handleDelete() {
    if (!selectedProfile) return;
    if (!window.confirm(`Delete profile "${selectedProfile}"?`)) return;
    try {
      await deleteCredential(selectedProfile);
      const updated = await listCredentials();
      setProfiles(updated);
      setSelectedProfile("");
      flash(`Deleted "${selectedProfile}"`);
    } catch {
      flash("Failed to delete", false);
    }
  }

  const count = [...new Set(raw.split("\n").map((l) => l.trim()).filter(Boolean))].length;

  return (
    <div style={s.container}>
      <span style={s.label}>Devices</span>

      <textarea
        style={s.textarea}
        placeholder={"192.168.1.1\n192.168.1.2\nhostname.local"}
        value={raw}
        onChange={handleDeviceChange}
        spellCheck={false}
        onFocus={focusBorder}
        onBlur={blurBorder}
      />
      <span style={s.count}>{count} device{count !== 1 ? "s" : ""}</span>

      {/* Credentials */}
      <div style={s.row}>
        <input
          style={s.input}
          type="text"
          placeholder="Username"
          value={credentials.username}
          onChange={(e) => onCredentialsChange({ ...credentials, username: e.target.value })}
          onFocus={focusBorder}
          onBlur={blurBorder}
          autoComplete="off"
        />
        <input
          style={s.input}
          type="password"
          placeholder="Password"
          value={credentials.password}
          onChange={(e) => onCredentialsChange({ ...credentials, password: e.target.value })}
          onFocus={focusBorder}
          onBlur={blurBorder}
          autoComplete="new-password"
        />
      </div>

      {/* Credential Manager section */}
      <div style={s.divider}>
        <div style={s.sectionLabel}>Windows Credential Manager</div>

        {/* Load / Delete a saved profile */}
        <div style={s.profileRow}>
          <select
            style={s.select}
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
          >
            <option value="">— saved profiles —</option>
            {profiles.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.username})
              </option>
            ))}
          </select>
          <button style={s.btn(true)} onClick={handleLoad} disabled={!selectedProfile}>
            Load
          </button>
          <button
            style={s.deleteBtn}
            onClick={handleDelete}
            disabled={!selectedProfile}
            title="Delete profile"
          >
            ✕
          </button>
        </div>

        {/* Save current credentials as a new profile */}
        <div style={{ ...s.saveRow, marginTop: 6 }}>
          <input
            style={{ ...s.input, fontSize: 11, padding: "5px 8px" }}
            type="text"
            placeholder="Profile name…"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onFocus={focusBorder}
            onBlur={blurBorder}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <button style={s.btn(true)} onClick={handleSave}>
            Save
          </button>
        </div>

        {msg && <div style={s.msg(msg.ok)}>{msg.ok ? "✓" : "✗"} {msg.text}</div>}
      </div>
    </div>
  );
}
