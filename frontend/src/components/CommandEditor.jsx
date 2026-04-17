import React from "react";
import Editor from "@monaco-editor/react";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    height: "100%",
  },
  label: {
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "var(--blue-light)",
    opacity: 0.8,
  },
  editorWrap: {
    flex: 1,
    border: "1px solid var(--border)",
    borderRadius: 6,
    overflow: "hidden",
  },
};

const MONACO_THEME = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "", foreground: "e0e8ff", background: "000000" },
    { token: "comment", foreground: "4a6080" },
    { token: "string", foreground: "00a3e0" },
    { token: "keyword", foreground: "fed700" },
  ],
  colors: {
    "editor.background": "#00000080",
    "editor.foreground": "#e0e8ff",
    "editorCursor.foreground": "#00a3e0",
    "editor.lineHighlightBackground": "#003da520",
    "editorLineNumber.foreground": "#003da5",
    "editor.selectionBackground": "#003da580",
    "editor.inactiveSelectionBackground": "#003da530",
  },
};

export function CommandEditor({ value, onChange }) {
  function handleMount(editor, monaco) {
    monaco.editor.defineTheme("remoterunner", MONACO_THEME);
    monaco.editor.setTheme("remoterunner");
  }

  return (
    <div style={styles.container}>
      <span style={styles.label}>Command</span>
      <div style={styles.editorWrap}>
        <Editor
          height="100%"
          defaultLanguage="shell"
          value={value}
          onChange={onChange}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: "off",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: { vertical: "hidden", horizontal: "hidden" },
            folding: false,
            glyphMargin: false,
            contextmenu: false,
          }}
          theme="remoterunner"
        />
      </div>
    </div>
  );
}
