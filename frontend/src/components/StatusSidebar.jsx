import React from "react";

// status: 'idle' | 'running' | 'success' | 'error'
function DeviceNode({ device, status }) {
  const colors = {
    idle: "rgba(224,232,255,0.2)",
    running: "var(--yellow)",
    success: "var(--blue-light)",
    error: "var(--red)",
  };

  const animations = {
    idle: "none",
    running: "pulse-running 1s ease-in-out infinite",
    success: "pulse-success 2s ease-in-out infinite",
    error: "pulse-error 2s ease-in-out infinite",
  };

  const icons = {
    idle: "○",
    running: "◉",
    success: "●",
    error: "✕",
  };

  const color = colors[status] || colors.idle;
  const anim = animations[status] || "none";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        borderRadius: 6,
        background: "rgba(0,0,0,0.2)",
        border: `1px solid ${color}`,
        transition: "border-color 0.4s ease, box-shadow 0.4s ease",
        animation: anim,
        cursor: "default",
      }}
    >
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: color,
          flexShrink: 0,
          boxShadow: `0 0 6px ${color}`,
          transition: "background 0.4s, box-shadow 0.4s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 8,
        }}
      />
      <span
        style={{
          fontSize: 11,
          color: "var(--text)",
          opacity: status === "idle" ? 0.5 : 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
          transition: "opacity 0.3s",
        }}
        title={device}
      >
        {device}
      </span>
      <span style={{ fontSize: 9, color, transition: "color 0.3s" }}>
        {icons[status]}
      </span>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    height: "100%",
    overflowY: "auto",
  },
  label: {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--blue-light)",
    opacity: 0.8,
    marginBottom: 4,
    flexShrink: 0,
  },
  empty: {
    color: "var(--text-muted)",
    fontSize: 11,
    textAlign: "center",
    padding: "20px 0",
  },
  legend: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingTop: 12,
    borderTop: "1px solid var(--border)",
    flexShrink: 0,
  },
  legendRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 10,
    color: "var(--text-muted)",
  },
  dot: (color) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  }),
};

export function StatusSidebar({ devices, deviceStatuses }) {
  return (
    <div style={styles.container}>
      <span style={styles.label}>Devices</span>
      {devices.length === 0 && (
        <span style={styles.empty}>No devices</span>
      )}
      {devices.map((d) => (
        <DeviceNode key={d} device={d} status={deviceStatuses[d] || "idle"} />
      ))}
      <div style={styles.legend}>
        {[
          ["var(--text-muted)", "Idle"],
          ["var(--yellow)", "Running"],
          ["var(--blue-light)", "Success"],
          ["var(--red)", "Failed"],
        ].map(([color, label]) => (
          <div key={label} style={styles.legendRow}>
            <div style={styles.dot(color)} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
