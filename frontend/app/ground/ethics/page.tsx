"use client";

import { useEffect, useState } from "react";
import { getEthicsLog, exportEthicsLog } from "@/lib/api";
import type { EthicsLogEntry } from "@/lib/types";

const EVENT_COLORS: Record<string, string> = {
  SCENARIO_INJECT: "text-danger",
  CHROMOTHERAPY_CHANGE: "text-accent",
  CONSENT_CHANGE: "text-blue-400",
  PRIVACY_PAUSE: "text-warning",
  ALARM_DISMISS: "text-slate-400",
};

function HashChainBadge({ valid }: { valid: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${valid ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {valid ? "Hash chain valid" : "Chain broken!"}
    </span>
  );
}

export default function EthicsPage() {
  const [entries, setEntries] = useState<EthicsLogEntry[]>([]);
  const [chainValid, setChainValid] = useState(true);
  const [filter, setFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getEthicsLog();
      setEntries(data);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const verifyChain = () => {
    // Client-side hash chain verification
    let prev = "genesis";
    for (const e of [...entries].reverse()) {
      if (e.prev_hash !== prev) {
        setChainValid(false);
        return;
      }
      prev = e.hash;
    }
    setChainValid(true);
  };

  useEffect(() => { verifyChain(); }, [entries]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportEthicsLog();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `synapse1-ethics-log-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    } catch {}
    setExporting(false);
  };

  const filtered = entries.filter(e =>
    !filter || e.event_type.toLowerCase().includes(filter.toLowerCase()) ||
    e.actor_id.includes(filter) || e.actor_role.includes(filter.toUpperCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Ethical Accountability Ledger</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tamper-evident, append-only, hash-chained record of every consequential action.
            This ledger operationalises the SYNAPSE-1 ethical commitment — not as prose, but as system.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <HashChainBadge valid={chainValid} />
          <button onClick={handleExport} disabled={exporting}
            className="px-4 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent text-xs hover:bg-accent/20 transition-colors disabled:opacity-50">
            {exporting ? "Exporting..." : "Export JSON"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Object.entries(
          entries.reduce((acc, e) => ({ ...acc, [e.event_type]: (acc[e.event_type] ?? 0) + 1 }), {} as Record<string, number>)
        ).slice(0, 5).map(([type, count]) => (
          <div key={type} className="border border-surface-2 rounded-xl p-3 bg-surface/50">
            <div className={`text-xs font-mono mb-1 ${EVENT_COLORS[type] ?? "text-slate-400"}`}>{type}</div>
            <div className="text-xl font-bold font-mono text-slate-100">{count}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-4">
        <input type="text" placeholder="Filter by event type, actor..." value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full max-w-sm px-4 py-2 bg-surface-2 border border-surface-3 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-accent font-mono" />
      </div>

      {/* Log table */}
      <div className="border border-surface-2 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[120px_80px_120px_180px_1fr_80px] bg-surface-2 px-4 py-2 text-xs text-slate-500 uppercase tracking-wider border-b border-surface-3">
          <div>Timestamp</div>
          <div>Role</div>
          <div>Actor</div>
          <div>Event</div>
          <div>Payload</div>
          <div>Hash</div>
        </div>
        <div className="divide-y divide-surface-2 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No entries yet. Actions in the habitat will appear here.
            </div>
          ) : (
            filtered.map((e) => (
              <div key={e.id}
                className="grid grid-cols-[120px_80px_120px_180px_1fr_80px] px-4 py-2.5 text-xs hover:bg-surface/50 transition-colors items-start">
                <div className="font-mono text-slate-500">
                  {new Date(e.ts).toLocaleTimeString("en-US", { hour12: false })}
                </div>
                <div>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${e.actor_role === "GROUND" ? "bg-accent/10 text-accent" : "bg-blue-500/10 text-blue-400"}`}>
                    {e.actor_role}
                  </span>
                </div>
                <div className="font-mono text-slate-400">{e.actor_id}</div>
                <div className={`font-mono ${EVENT_COLORS[e.event_type] ?? "text-slate-400"}`}>
                  {e.event_type}
                </div>
                <div className="text-slate-500 truncate font-mono">{e.payload}</div>
                <div className="font-mono text-slate-700 text-xs truncate" title={e.hash}>
                  {e.hash.slice(0, 8)}…
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chain integrity note */}
      <div className="mt-4 text-xs text-slate-600 italic">
        Each entry's hash = SHA-256(prev_hash + timestamp + actor + event + payload).
        The chain can be independently verified by any party. Crew can export their own slice.
      </div>
    </div>
  );
}
