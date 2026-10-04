"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { postJson, useLiveState } from "@/hooks/useLiveState";

export function WorkerBoard() {
  const { state, connected } = useLiveState();
  const [workerId, setWorkerId] = useState("W-101");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const worker = state?.workers.find((item) => item.id === workerId);
  const myJobs = useMemo(
    () => state?.jobs.filter((job) => job.workerId === workerId) ?? [],
    [state, workerId],
  );
  const active = myJobs.filter((job) => job.status === "assigned");
  const done = myJobs.filter((job) => job.status === "completed");

  async function emptyBin(jobId: string) {
    setError(null);
    setBusy(true);
    try {
      await postJson(`/api/jobs/${jobId}/complete`, {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not close job");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell role="worker">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f7a68]">
            Field crew
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#12261c]">
            Worker jobs
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#4b6456]">
            Open a job, go to the unique bin ID, empty the garbage, then mark the
            bin clear so the administrator sees it resolved.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm ${connected ? "bg-[#dff6d0] text-[#1f5b32]" : "bg-amber-100 text-amber-800"}`}
        >
          {connected ? "Live jobs" : "Reconnecting"}
        </span>
      </div>

      <label className="mb-5 block max-w-sm text-sm">
        <span className="mb-1 block font-medium text-[#12261c]">Sign in as worker</span>
        <select
          value={workerId}
          onChange={(event) => setWorkerId(event.target.value)}
          className="w-full rounded-xl border border-[#12261c]/15 bg-white px-3 py-2"
        >
          {state?.workers.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.id}
            </option>
          ))}
        </select>
      </label>

      {error ? (
        <p className="mb-4 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <p className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm text-[#4b6456] shadow-sm">
        Status:{" "}
        <strong className="text-[#12261c]">
          {!worker
            ? "Loading worker roster"
            : worker.status === "available"
              ? "Available for the next overflow"
              : `Assigned to ${worker.assignedBinId}`}
        </strong>
      </p>

      <h2 className="mb-3 text-lg font-semibold text-[#12261c]">Assigned collections</h2>
      {active.length === 0 ? (
        <p className="mb-8 rounded-2xl border border-dashed border-[#c9dcc4] bg-white px-4 py-8 text-sm text-[#5f7a68]">
          No active job. Wait for the administrator to dispatch you when a bin is
          completely full.
        </p>
      ) : (
        <ul className="mb-8 grid gap-4 md:grid-cols-2">
          {active.map((job) => {
            const bin = state?.bins.find((item) => item.id === job.binId);
            const society = state?.societies.find((item) => item.id === job.societyId);
            return (
              <li key={job.id} className="rounded-3xl border border-sky-200 bg-white p-5 shadow-sm">
                <p className="font-mono text-lg font-bold text-[#12261c]">{job.binId}</p>
                <p className="text-sm text-[#4b6456]">
                  {society?.name} · {bin?.location}
                </p>
                <p className="mt-3 text-sm text-[#12261c]">{job.instruction}</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void emptyBin(job.id)}
                  className="mt-4 rounded-xl bg-[#12261c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1c3b2c] disabled:opacity-60"
                >
                  Garbage taken — mark bin empty
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mb-3 text-lg font-semibold text-[#12261c]">Completed today</h2>
      <ul className="space-y-2">
        {done.slice(0, 8).map((job) => (
          <li
            key={job.id}
            className="rounded-xl bg-white px-4 py-2 text-sm text-[#4b6456] shadow-sm"
          >
            Emptied <span className="font-mono font-semibold">{job.binId}</span>
          </li>
        ))}
        {done.length === 0 ? (
          <li className="text-sm text-[#5f7a68]">No completed collections yet.</li>
        ) : null}
      </ul>
    </AppShell>
  );
}
