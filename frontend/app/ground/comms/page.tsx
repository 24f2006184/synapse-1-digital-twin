"use client";

import { useEffect, useState } from "react";
import { getCommsStatus, getRegolithQueue } from "@/lib/api";
import type { CommsStatus } from "@/lib/types";

function CommsClock({ comms }: { comms: CommsStatus | null }) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!comms) return;
    setCountdown(comms.next_window_s);
    const id = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(id);
  }, [comms?.next_window_s]);

  const h = Math.floor(countdown / 3600);
  const m = Math.floor((countdown % 3600) / 60);
  const s = Math.floor(countdown % 60);

  return (
    <div className="border border-surface-2 rounded-xl p-6 bg-surface/50 text-center">
      <div className="label-xs text-slate-400 mb-4">Next Letter Window</div>
      <div className="font-mono text-4xl text-accent mb-2">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </div>
      <div className="text-xs text-slate-500">Crew framing: "Next letter window"</div>
      <div className="text-xs text-slate-600 mt-1">Ground framing: Operational comms constraint</div>
      {comms && (
        <div className="mt-4 grid grid-cols-2 gap-3 text-left">
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="label-xs text-slate-500 mb-1">One-way latency</div>
            <div className="font-mono text-accent">{comms.one_way_latency_s}s</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="label-xs text-slate-500 mb-1">Round trip</div>
            <div className="font-mono text-accent">{comms.round_trip_s}s</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="label-xs text-slate-500 mb-1">Mission day</div>
            <div className="font-mono text-slate-300">{comms.mission_day}</div>
          </div>
          <div className="bg-surface-2 rounded-lg p-3">
            <div className="label-xs text-slate-500 mb-1">Status</div>
            <div className={`font-mono ${comms.status === "NOMINAL" ? "text-success" : "text-warning"}`}>
              {comms.status}
            </div>
          </div>
        </div>
      )}
      <div className="mt-4 text-xs text-slate-600 italic text-left">
        Same data, two phenomenologies: crew see ritual time-keeping, Ground see operational constraint.
        This is human-centred design.
      </div>
    </div>
  );
}

function RegolithQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    getRegolithQueue().then(d => {
      setQueue(d.queue || []);
      setTotal(d.total_shield_kg || 0);
    }).catch(() => {});
    const id = setInterval(() => {
      getRegolithQueue().then(d => {
        setQueue(d.queue || []);
        setTotal(d.total_shield_kg || 0);
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="label-xs text-slate-400">Regolith Brick Queue</div>
          <div className="text-xs text-slate-500 mt-0.5">Sporosarcina pasteurii ISRU · Rovers active</div>
        </div>
        <div className="text-right">
          <div className="label-xs text-slate-400">Shield contribution</div>
          <div className="font-mono text-accent">{total.toFixed(1)} kg</div>
        </div>
      </div>
      <div className="space-y-2">
        {queue.map((brick, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-16 text-xs font-mono text-slate-400">{brick.batch_id}</div>
            <div className="flex-1 bg-surface-2 rounded-full h-2">
              <div className="h-2 rounded-full transition-all duration-1000"
                style={{
                  width: `${brick.cure_pct}%`,
                  background: brick.cure_pct >= 100 ? "#10b981" : `linear-gradient(90deg, #06b6d4, #a78bfa)`,
                }} />
            </div>
            <div className="w-12 text-xs font-mono text-right">
              <span className={brick.cure_pct >= 100 ? "text-success" : "text-accent"}>
                {brick.cure_pct.toFixed(0)}%
              </span>
            </div>
            <div className="w-8 text-xs text-slate-500">{brick.shield_contribution_kg.toFixed(0)}kg</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CommsPage() {
  const [comms, setComms] = useState<CommsStatus | null>(null);

  useEffect(() => {
    getCommsStatus().then(setComms).catch(() => {});
    const id = setInterval(() => getCommsStatus().then(setComms).catch(() => {}), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Communications & ISRU</h1>
        <p className="text-slate-500 text-sm mt-1">
          Comms latency theatre + Regolith brick curing queue.
          The habitat makes distance and construction tangible — not just operational, but meaningful.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <CommsClock comms={comms} />
        <RegolithQueue />
      </div>
    </div>
  );
}
