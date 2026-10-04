"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BinCard } from "@/components/BinCard";
import { postJson, useLiveState } from "@/hooks/useLiveState";

export function ResidentView() {
  const { state, connected } = useLiveState();
  const [societyId, setSocietyId] = useState("green-meadows");
  const [lookup, setLookup] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bins = useMemo(
    () => state?.bins.filter((bin) => bin.societyId === societyId) ?? [],
    [state, societyId],
  );
  const society = state?.societies.find((item) => item.id === societyId);
  const match = lookup
    ? bins.find((bin) => bin.id.toLowerCase() === lookup.trim().toLowerCase())
    : null;

  async function report(id: string) {
    setError(null);
    setMessage(null);
    try {
      await postJson(`/api/bins/${id}`, { reportFull: true });
      setMessage(
        `Reported ${id}. The administrator has been notified that this bin is completely full.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report failed");
    }
  }

  return (
    <AppShell role="resident">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f7a68]">
          Society desk
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#12261c]">
          Neighbourhood bins
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#4b6456]">
          Find a bin by its unique ID. If it is overflowing, report it and the
          administrator gets the same full-bin alert as the IoT sensors.
        </p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
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
        <span className="ml-auto text-xs text-[#5f7a68]">
          {connected ? "Live levels" : "Reconnecting"} · {society?.area}
        </span>
      </div>

      <form
        className="mb-5 flex max-w-xl gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (match) void report(match.id);
          else setError("No bin with that ID in this society.");
        }}
      >
        <input
          value={lookup}
          onChange={(event) => setLookup(event.target.value)}
          placeholder="Enter unique bin ID, e.g. BIN-GM-07"
          className="flex-1 rounded-xl border border-[#12261c]/15 bg-white px-3 py-2 font-mono text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Report full
        </button>
      </form>

      {message ? (
        <p className="mb-4 rounded-xl bg-[#dff6d0] px-3 py-2 text-sm text-[#1f5b32]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {bins.map((bin) => (
          <BinCard key={bin.id} bin={bin} onReport={() => void report(bin.id)} />
        ))}
      </div>
    </AppShell>
  );
}
