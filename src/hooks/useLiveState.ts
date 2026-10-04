"use client";

import { useEffect, useMemo, useState } from "react";
import type { AppState } from "@/lib/types";

type LivePayload = {
  type?: string;
  simulating?: boolean;
  state?: AppState;
  message?: string;
  binId?: string;
};

export function useLiveState() {
  const [state, setState] = useState<AppState | null>(null);
  const [simulating, setSimulating] = useState(true);
  const [latestMessage, setLatestMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let source: EventSource | null = null;
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        const data = await response.json();
        if (cancelled) return;
        setState(data);
        setSimulating(Boolean(data.simulating));
      } catch {
        setConnected(false);
      }
    }

    void load();
    const poll = window.setInterval(() => {
      void load();
    }, 2500);
    source = new EventSource("/api/stream");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as LivePayload;
      if (payload.state) setState(payload.state);
      if (typeof payload.simulating === "boolean") setSimulating(payload.simulating);
      if (payload.type === "bin.full" && payload.message) {
        setLatestMessage(payload.message);
      }
    };

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      source?.close();
    };
  }, []);

  const openAlerts = useMemo(
    () => state?.alerts.filter((alert) => alert.status !== "resolved") ?? [],
    [state],
  );

  return { state, simulating, connected, latestMessage, openAlerts, setLatestMessage };
}

export async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }
  return data;
}
