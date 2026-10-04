"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BinCard } from "@/components/BinCard";
import { postJson, useLiveState } from "@/hooks/useLiveState";

export function AdminDashboard() {
  const { state, simulating, connected, latestMessage, openAlerts, setLatestMessage } =
    useLiveState();
  const [societyId, setSocietyId] = useState("green-meadows");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bins = useMemo(
    () => state?.bins.filter((bin) => bin.societyId === societyId) ?? [],
    [state, societyId],
  );
  const society = state?.societies.find((item) => item.id === societyId);
  const availableWorkers =
    state?.workers.filter((worker) => worker.status === "available") ?? [];

  async function fillBin(id: string) {
    setError(null);
    setBusy(id);
    try {
      await postJson(`/api/bins/${id}`, { fillLevel: 100 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function dispatch(alertId: string, workerId: string) {
    setError(null);
    setBusy(alertId);
    try {
      await postJson(`/api/alerts/${alertId}/dispatch`, { workerId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dispatch failed");
    } finally {
      setBusy(null);
    }
  }

  async function toggleSim() {
    await postJson("/api/simulate", { on: !simulating });
  }

  return (
    <AppShell role="admin">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f7a68]">
            Control room
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#12261c]">
            Administrator desk
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#4b6456]">
            Each bin has a unique ID. When any bin reaches 100%, an alert is pushed
            here so you can send workers to empty it.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span
            className={`rounded-full px-3 py-1 ${connected ? "bg-[#dff6d0] text-[#1f5b32]" : "bg-amber-100 text-amber-800"}`}
          >
            {connected ? "Live feed on" : "Reconnecting"}
          </span>
          <button
            type="button"
            onClick={() => void toggleSim()}
            className="rounded-full border border-[#12261c]/15 bg-white px-3 py-1 font-medium"
          >
            IoT sensors {simulating ? "running" : "paused"}
          </button>
        </div>
      </div>

      {latestMessage ? (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-900">
          <p className="text-sm font-medium">{latestMessage}</p>
          <button
            type="button"
            className="text-xs font-semibold uppercase tracking-wide"
            onClick={() => setLatestMessage(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <section className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Tracked bins" value={state?.stats.totalBins ?? "—"} />
        <Stat label="Completely full" value={state?.stats.fullBins ?? "—"} warn />
        <Stat label="Open alerts" value={state?.stats.openAlerts ?? "—"} warn />
        <Stat label="Workers free" value={state?.stats.workersAvailable ?? "—"} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="order-2 lg:order-1">
          <div className="mb-4 flex flex-wrap gap-2">
            {state?.societies.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSocietyId(item.id)}
                className={`rounded-full px-4 py-2 text-sm ${
                  item.id === societyId
                    ? "bg-[#12261c] text-white"
                    : "bg-white text-[#12261c] ring-1 ring-[#12261c]/10"
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-[#12261c]">
              {society?.name} · 20 unique bins
            </h2>
            <p className="text-xs text-[#5f7a68]">{society?.area}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {bins.map((bin) => (
              <BinCard
                key={bin.id}
                bin={bin}
                onFill={bin.fillLevel < 100 ? () => void fillBin(bin.id) : undefined}
              />
            ))}
          </div>
        </section>

        <aside className="order-1 space-y-5 lg:order-2">
          <section className="rounded-3xl border border-[#d7e6d2] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[#12261c]">Full-bin alerts</h2>
            <p className="mb-3 text-xs text-[#5f7a68]">
              Dispatch a free worker to haul garbage from the identified bin.
            </p>
            {openAlerts.length === 0 ? (
              <p className="rounded-xl bg-[#f3f7f1] px-3 py-4 text-sm text-[#4b6456]">
                No overflow alerts. All bins are being emptied on time.
              </p>
            ) : (
              <ul className="space-y-3">
                {openAlerts.map((alert) => {
                  const bin = state?.bins.find((item) => item.id === alert.binId);
                  return (
                    <li
                      key={alert.id}
                      className="rounded-2xl border border-red-100 bg-red-50/70 p-3"
                    >
                      <p className="font-mono text-sm font-bold">{alert.binId}</p>
                      <p className="mt-1 text-sm text-[#4b1d18]">{alert.message}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-wide text-[#8a4a42]">
                        {alert.status} · {bin?.location}
                      </p>
                      {alert.status === "open" ? (
                        <div className="mt-2">
                          <label className="text-[11px] font-semibold uppercase tracking-wide text-[#5f7a68]">
                            Send worker
                          </label>
                          <select
                            className="mt-1 w-full rounded-lg border border-[#12261c]/15 bg-white px-2 py-1.5 text-sm"
                            defaultValue=""
                            disabled={busy === alert.id}
                            onChange={(event) => {
                              if (event.target.value) {
                                void dispatch(alert.id, event.target.value);
                                event.target.value = "";
                              }
                            }}
                          >
                            <option value="">Choose a free worker</option>
                            {availableWorkers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.name} ({worker.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs font-medium text-sky-800">
                          Worker {alert.workerId} is on the way.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-[#d7e6d2] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[#12261c]">Crew</h2>
            <ul className="mt-2 space-y-2">
              {state?.workers.map((worker) => (
                <li
                  key={worker.id}
                  className="flex items-center justify-between rounded-xl bg-[#f3f7f1] px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{worker.name}</span>
                    <span className="ml-2 font-mono text-xs text-[#5f7a68]">
                      {worker.id}
                    </span>
                  </span>
                  <span className="text-xs uppercase tracking-wide">
                    {worker.status === "available"
                      ? "Free"
                      : `En route to ${worker.assignedBinId}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#d7e6d2] bg-white px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-[#5f7a68]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${warn ? "text-red-700" : "text-[#12261c]"}`}>
        {value}
      </p>
    </div>
  );
}
