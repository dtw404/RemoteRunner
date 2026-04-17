import { useEffect, useRef, useCallback } from "react";

export function useWebSocket({ jobId, onMessage, onDone }) {
  const wsRef = useRef(null);

  const connect = useCallback(
    (id) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const ws = new WebSocket(`${protocol}://${window.location.host}/ws/${id}`);
      wsRef.current = ws;

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "output") {
            onMessage?.(msg.device, msg.chunk);
          } else if (msg.type === "done") {
            onDone?.(msg.results);
          }
        } catch {
          /* ignore malformed */
        }
      };

      ws.onerror = () => {
        console.error("WebSocket error for job", id);
      };
    },
    [onMessage, onDone]
  );

  useEffect(() => {
    if (jobId) connect(jobId);
    return () => {
      wsRef.current?.close();
    };
  }, [jobId, connect]);

  return { connect };
}
