import React, { useState, useRef, useCallback } from "react";
import { DeviceInput } from "./components/DeviceInput.jsx";
import { CommandEditor } from "./components/CommandEditor.jsx";
import { Terminal } from "./components/Terminal.jsx";
import { StatusSidebar } from "./components/StatusSidebar.jsx";
import { ResultsTable } from "./components/ResultsTable.jsx";
import { useWebSocket } from "./hooks/useWebSocket.js";
import { runCommand } from "./services/api.js";

const layout = {
  root: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gridTemplateRows: "56px 1fr 220px",
    gridTemplateAreas: `
      "topbar topbar"
      "sidebar main"
      "sidebar bottom"
    `,
    height: "100vh",
    gap: 8,
    padding: 8,
  },
  topbar: {
    gridArea: "topbar",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 16px",
  },
  logo: {
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    background: "linear-gradient(90deg, var(--blue-light), var(--yellow))",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  sidebar: {
    gridArea: "sidebar",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  main: {
    gridArea: "main",
    padding: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  terminal: {
    padding: 8,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  bottom: {
    gridArea: "bottom",
    padding: 12,
    overflow: "hidden",
  },
  runBtn: {
    marginLeft: "auto",
    background: "linear-gradient(135deg, var(--blue-dark), var(--blue-light))",
    border: "none",
    borderRadius: 6,
    color: "#fff",
    fontFamily: "var(--font)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.1em",
    padding: "8px 20px",
    textTransform: "uppercase",
    transition: "opacity 0.2s, transform 0.1s",
  },
  themeBtn: {
    background: "rgba(255,255,255,0.07)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--text-muted)",
    fontSize: 11,
    padding: "4px 10px",
  },
  status: {
    fontSize: 11,
    color: "var(--text-muted)",
    marginLeft: 8,
  },
  termLabel: {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--blue-light)",
    opacity: 0.8,
    marginBottom: 6,
    flexShrink: 0,
  },
};

export default function App() {
  const [devices, setDevices] = useState([]);
  const [command, setCommand] = useState("show version");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [results, setResults] = useState([]);
  const [deviceStatuses, setDeviceStatuses] = useState({});
  const [theme, setTheme] = useState("dark");
  const [statusMsg, setStatusMsg] = useState("");

  const termRef = useRef(null);

  const onMessage = useCallback((device, chunk) => {
    termRef.current?.writeChunk(device, chunk);
  }, []);

  const onDone = useCallback((finalResults) => {
    setResults(finalResults);
    setRunning(false);
    setStatusMsg(`Done — ${finalResults.length} device(s)`);

    const statuses = {};
    finalResults.forEach((r) => {
      statuses[r.device] = r.status ? "success" : "error";
    });
    setDeviceStatuses(statuses);

    finalResults.forEach((r) => {
      termRef.current?.writeDeviceDone(r.device, r.status, r.duration_ms);
    });
  }, []);

  useWebSocket({ jobId, onMessage, onDone });

  async function handleRun() {
    if (!devices.length || !command.trim() || running) return;

    setRunning(true);
    setResults([]);
    setStatusMsg("Connecting…");
    termRef.current?.clear();

    const statuses = {};
    devices.forEach((d) => {
      statuses[d] = "running";
      termRef.current?.writeDeviceHeader(d);
    });
    setDeviceStatuses(statuses);

    try {
      const { job_id } = await runCommand({
        devices,
        command: command.trim(),
        username: credentials.username,
        password: credentials.password,
      });
      setJobId(job_id);
      setStatusMsg(`Job ${job_id.slice(0, 8)}… running`);
    } catch (err) {
      setRunning(false);
      setStatusMsg(`Error: ${err.message}`);
      const errStatuses = {};
      devices.forEach((d) => (errStatuses[d] = "error"));
      setDeviceStatuses(errStatuses);
    }
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }

  const canRun = devices.length > 0 && command.trim() && !running;

  return (
    <div style={layout.root}>
      {/* Top bar */}
      <div className="glass" style={layout.topbar}>
        <span style={layout.logo}>RemoteRunner</span>
        <span style={layout.status}>{statusMsg}</span>
        <button
          style={layout.themeBtn}
          onClick={toggleTheme}
          onMouseEnter={(e) => (e.target.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
        >
          {theme === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
        <button
          style={{
            ...layout.runBtn,
            opacity: canRun ? 1 : 0.4,
            cursor: canRun ? "pointer" : "not-allowed",
          }}
          onClick={handleRun}
          disabled={!canRun}
          onMouseEnter={(e) => canRun && (e.target.style.opacity = 0.85)}
          onMouseLeave={(e) => (e.target.style.opacity = canRun ? 1 : 0.4)}
          onMouseDown={(e) => canRun && (e.target.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
        >
          {running ? "Running…" : "▶ Run"}
        </button>
      </div>

      {/* Left sidebar — device status nodes */}
      <div className="glass" style={layout.sidebar}>
        <DeviceInput
          onDevicesChange={setDevices}
          credentials={credentials}
          onCredentialsChange={setCredentials}
        />
      </div>

      {/* Main — command editor + terminal */}
      <div style={layout.main}>
        {/* Command editor */}
        <div className="glass" style={{ padding: 12 }}>
          <CommandEditor value={command} onChange={setCommand} />
        </div>

        {/* Terminal */}
        <div className="glass" style={layout.terminal}>
          <div style={layout.termLabel}>Live Output</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Terminal termRef={termRef} />
          </div>
        </div>
      </div>

      {/* Bottom — status sidebar + results table */}
      <div
        style={{
          gridArea: "bottom",
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 8,
          padding: "0 8px 8px",
        }}
      >
        <div className="glass" style={{ padding: 12, overflow: "hidden" }}>
          <StatusSidebar devices={devices} deviceStatuses={deviceStatuses} />
        </div>
        <div className="glass" style={{ padding: 12, overflow: "hidden" }}>
          <ResultsTable results={results} />
        </div>
      </div>
    </div>
  );
}
