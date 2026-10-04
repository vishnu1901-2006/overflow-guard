"use client";

import type { Bin } from "@/lib/types";

export function fillTone(fillLevel: number, status: Bin["status"]) {
  if (status === "assigned") return "assigned";
  if (fillLevel >= 100) return "full";
  if (fillLevel >= 80) return "warning";
  return "ok";
}

export function BinCard({
  bin,
  onFill,
  onReport,
  compact = false,
}: {
  bin: Bin;
  onFill?: () => void;
  onReport?: () => void;
  compact?: boolean;
}) {
  const tone = fillTone(bin.fillLevel, bin.status);
  const styles = {
    ok: "border-[#d5e7cc] bg-white",
    warning: "border-amber-300 bg-amber-50",
    full: "border-red-400 bg-red-50 ring-2 ring-red-500/30",
    assigned: "border-sky-300 bg-sky-50",
  }[tone];
  const bar = {
    ok: "bg-[#3d8c55]",
    warning: "bg-amber-500",
    full: "bg-red-600",
    assigned: "bg-sky-600",
  }[tone];

  return (
    <article className={`flex flex-col rounded-2xl border p-3 shadow-sm ${styles}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-sm font-bold tracking-tight text-[#163023]">
            {bin.id}
          </p>
          <p className="text-xs text-[#4d6558]">{bin.location}</p>
        </div>
        <span className="rounded-full bg-[#163023] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {tone}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e3eee0]">
        <div className={`h-full ${bar}`} style={{ width: `${bin.fillLevel}%` }} />
      </div>
      <p className="mt-1 text-right text-xs font-semibold text-[#163023]">
        {bin.fillLevel}% full
      </p>
      {!compact && (onFill || onReport) ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {onFill ? (
            <button
              type="button"
              onClick={onFill}
              className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700"
            >
              Mark 100% full
            </button>
          ) : null}
          {onReport ? (
            <button
              type="button"
              onClick={onReport}
              className="rounded-lg border border-[#163023]/20 px-2.5 py-1 text-xs font-semibold text-[#163023] hover:bg-white"
            >
              Report overflow
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
