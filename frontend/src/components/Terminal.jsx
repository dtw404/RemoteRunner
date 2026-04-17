import React, { useEffect, useRef, useCallback } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

const COLORS = {
  header: "\x1b[38;2;0;163;224m",   // blue-light
  device: "\x1b[38;2;254;219;0m",   // yellow
  error: "\x1b[38;2;243;53;64m",    // red
  success: "\x1b[38;2;0;163;224m",  // blue
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

export function Terminal({ termRef }) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    const term = new XTerm({
      theme: {
        background: "#00000000",
        foreground: "#e0e8ff",
        cursor: "#00a3e0",
        cursorAccent: "#00a3e0",
        selection: "rgba(0, 61, 165, 0.4)",
        black: "#0a0a0f",
        blue: "#003da5",
        cyan: "#00a3e0",
        green: "#00a3e0",
        magenta: "#b11b83",
        red: "#f33540",
        white: "#e0e8ff",
        yellow: "#fedb00",
      },
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 12,
      lineHeight: 1.5,
      cursorBlink: false,
      cursorStyle: "bar",
      allowTransparency: true,
      disableStdin: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome message
    term.writeln(
      `${COLORS.dim}${COLORS.header}╔════════════════════════════════╗${COLORS.reset}`
    );
    term.writeln(
      `${COLORS.dim}${COLORS.header}║     RemoteRunner  Terminal      ║${COLORS.reset}`
    );
    term.writeln(
      `${COLORS.dim}${COLORS.header}╚════════════════════════════════╝${COLORS.reset}`
    );
    term.writeln("");

    // Expose write methods via ref
    if (termRef) {
      termRef.current = {
        writeDeviceHeader: (device) => {
          term.writeln(
            `\r\n${COLORS.device}${COLORS.bold}▶ ${device}${COLORS.reset}  ${COLORS.dim}${"─".repeat(40)}${COLORS.reset}`
          );
        },
        writeChunk: (device, chunk) => {
          const lines = chunk.replace(/\r\n/g, "\n").split("\n");
          lines.forEach((line, i) => {
            if (i < lines.length - 1) {
              term.writeln(`\r${line}`);
            } else if (line) {
              term.write(`\r${line}`);
            }
          });
        },
        writeDeviceDone: (device, status, durationMs) => {
          const color = status ? COLORS.success : COLORS.error;
          const icon = status ? "✓" : "✗";
          term.writeln(
            `\r\n${color}${icon} ${device} — ${status ? "OK" : "FAILED"} (${durationMs}ms)${COLORS.reset}`
          );
        },
        clear: () => {
          term.clear();
        },
        fit: () => {
          fitAddon.fit();
        },
      };
    }

    const ro = new ResizeObserver(() => fitAddon.fit());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      term.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "transparent",
      }}
    />
  );
}
