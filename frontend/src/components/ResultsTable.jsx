import React, { useState } from "react";
import { exportTxt, exportJson } from "../services/api.js";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    gap: 8,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexShrink: 0,
  },
  label: {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--blue-light)",
    opacity: 0.8,
  },
  exportBtns: {
    display: "flex",
    gap: 6,
  },
  btn: {
    background: "rgba(0,61,165,0.3)",
    border: "1px solid var(--blue-dark)",
    borderRadius: 4,
    color: "var(--blue-light)",
    fontSize: 10,
    padding: "3px 8px",
    letterSpacing: "0.05em",
    transition: "background 0.2s, border-color 0.2s",
  },
  table: {
    flex: 1,
    overflowY: "auto",
  },
  th: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "var(--text-muted)",
    padding: "6px 10px",
    textAlign: "left",
    borderBottom: "1px solid var(--border)",
    position: "sticky",
    top: 0,
    background: "var(--bg-panel)",
    backdropFilter: "blur(12px)",
  },
  td: {
    padding: "7px 10px",
    borderBottom: "1px solid rgba(0,163,224,0.07)",
    fontSize: 12,
    verticalAlign: "top",
  },
  statusOk: {
    color: "var(--blue-light)",
    fontWeight: 600,
  },
  statusFail: {
    color: "var(--red)",
    fontWeight: 600,
  },
  expandBtn: {
    background: "none",
    border: "1px solid var(--border)",
    borderRadius: 3,
    color: "var(--text-muted)",
    fontSize: 10,
    padding: "2px 6px",
    cursor: "pointer",
  },
  pre: {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: 8,
    fontSize: 11,
    lineHeight: 1.6,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
    marginTop: 4,
    color: "var(--text)",
    maxHeight: 200,
    overflowY: "auto",
  },
  empty: {
    color: "var(--text-muted)",
    fontSize: 11,
    textAlign: "center",
    padding: "20px 0",
  },
};

function Row({ result }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr style={{ transition: "background 0.2s" }}>
        <td style={styles.td} title={result.device}>
          {result.device}
        </td>
        <td style={styles.td}>
          <span style={result.status ? styles.statusOk : styles.statusFail}>
            {result.status ? "✓ OK" : "✗ FAIL"}
          </span>
        </td>
        <td style={{ ...styles.td, color: "var(--text-muted)" }}>
          {result.duration_ms}ms
        </td>
        <td style={styles.td}>
          <button
            style={styles.expandBtn}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "▲ hide" : "▼ show"}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={4} style={{ ...styles.td, padding: "0 10px 10px" }}>
            {result.output && <pre style={styles.pre}>{result.output}</pre>}
            {result.error && (
              <pre style={{ ...styles.pre, borderColor: "var(--red)", color: "var(--red)" }}>
                {result.error}
              </pre>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

export function ResultsTable({ results }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.label}>Results ({results.length})</span>
        {results.length > 0 && (
          <div style={styles.exportBtns}>
            <button
              style={styles.btn}
              onClick={() => exportTxt(results)}
              onMouseEnter={(e) => (e.target.style.background = "rgba(0,61,165,0.5)")}
              onMouseLeave={(e) => (e.target.style.background = "rgba(0,61,165,0.3)")}
            >
              Export TXT
            </button>
            <button
              style={styles.btn}
              onClick={() => exportJson(results)}
              onMouseEnter={(e) => (e.target.style.background = "rgba(0,61,165,0.5)")}
              onMouseLeave={(e) => (e.target.style.background = "rgba(0,61,165,0.3)")}
            >
              Export JSON
            </button>
          </div>
        )}
      </div>
      <div style={styles.table}>
        {results.length === 0 ? (
          <div style={styles.empty}>No results yet</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Device", "Status", "Duration", "Output"].map((h) => (
                  <th key={h} style={styles.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <Row key={r.device} result={r} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
