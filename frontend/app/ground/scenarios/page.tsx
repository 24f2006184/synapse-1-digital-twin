"use client";

import { useState, useEffect } from "react";
import { injectScenario, getEthicsLog } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend } from "recharts";

const SCENARIOS = [
  {
    name: "SolarProtonEvent",
    label: "Solar Proton Event",
    icon: "☀",
    color: "#ef4444",
    description: "Coronal mass ejection — shelter routing activated, water shield critical. HRV impacts within 60s.",
    effects: ["HRV drops 30-50%", "Shelter routing activates", "Water shield consumed", "Circadian disruption"],
  },
  {
    name: "CommsBlackout",
    label: "Comms Blackout",
    icon: "📡",
    color: "#f59e0b",
    description: "Earth link severed. Isolation stress cascade. Crew mood weather shifts. No letters, no voices.",
    effects: ["Affect valence drops", "Sleep debt accumulates", "Social cohesion pressure"],
  },
  {
    name: "InterpersonalConflict",
    label: "Interpersonal Conflict",
    icon: "⚡",
    color: "#f59e0b",
    description: "Social friction in Soma ring. Targeted stress affects select crew pairs.",
    effects: ["EDA rises in affected crew", "Holographic Hearth avoidance", "Cohesion heatmap shows tension"],
  },
  {
    name: "EquipmentFailure",
    label: "Equipment Failure",
    icon: "⚙",
    color: "#ef4444",
    description: "Critical systems emergency. Acute stress cascade across all engineering crew.",
    effects: ["Arousal spikes", "HR elevates", "Work zone pressure"],
  },
];

function ScenarioReplay() {
  const [replayData, setReplayData] = useState<any[]>([]);

  useEffect(() => {
    // Generate synthetic replay data for the last 24h
    const data = [];
    for (let i = 0; i < 288; i++) { // 5-min intervals
      const t = i / 288 * 24;
      const stress = i > 120 && i < 150 ? 1.8 : 1.0; // Simulated SPE at hour 10
      data.push({
        time: `${Math.floor(t)}:${String(Math.round((t % 1) * 60)).padStart(2, "0")}`,
        crew01_hrv: Math.max(20, 55 / stress + 5 * Math.sin(i * 0.3)),
        crew04_hrv: Math.max(20, 52 / stress + 5 * Math.cos(i * 0.25)),
        avg_alertness: 0.5 + 0.3 * Math.cos(2 * Math.PI * t / 24) / stress,
        scenario: i >= 120 && i < 150 ? 1 : 0,
      });
    }
    setReplayData(data);
  }, []);

  return (
    <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
      <div className="label-xs text-slate-400 mb-4">Scenario Replay — Last 24h (Simulated)</div>
      <div className="mb-2 text-xs text-slate-500">
        Shaded region: Solar Proton Event at MET+10h. HRV impact visible across crew.
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={replayData.filter((_, i) => i % 3 === 0)}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="time" stroke="#334155" tick={{ fontSize: 10 }} interval={20} />
          <YAxis stroke="#334155" tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
            labelStyle={{ color: "#94a3b8" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="crew01_hrv" name="Crew01 HRV" stroke="#06b6d4" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="crew04_hrv" name="Crew04 HRV" stroke="#a78bfa" dot={false} strokeWidth={1.5} />
          <Line type="monotone" dataKey="avg_alertness" name="Avg Alertness" stroke="#34d399" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-slate-600 italic">
        Replay uses seed-reproducible data. Same seed = same trajectory.
      </div>
    </div>
  );
}

export default function ScenariosPage() {
  const [seed, setSeed] = useState(42);
  const [injecting, setInjecting] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ name: string; ts: string; seed: number }>>([]);

  const handleInject = async (name: string) => {
    setInjecting(name);
    try {
      await injectScenario(name, seed);
      setHistory(prev => [{ name, ts: new Date().toISOString(), seed }, ...prev]);
    } catch {}
    setInjecting(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Scenario Control & Replay</h1>
        <p className="text-slate-500 text-sm mt-1">
          Inject stress scenarios to test habitat behavioural support systems.
          All injections are logged to the ethics ledger with seed for reproducibility.
        </p>
      </div>

      {/* Seed control */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-400">Random seed:</label>
        <input type="number" value={seed} onChange={e => setSeed(parseInt(e.target.value) || 42)}
          className="w-24 px-3 py-1.5 bg-surface-2 border border-surface-3 rounded text-sm font-mono text-slate-300 focus:outline-none focus:border-accent" />
        <span className="text-xs text-slate-500">Same seed = reproducible HRV cascade for jury demo</span>
      </div>

      {/* Scenario cards */}
      <div className="grid grid-cols-2 gap-4">
        {SCENARIOS.map((s) => (
          <div key={s.name} className="border border-surface-2 rounded-xl p-4 bg-surface/50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{s.icon}</span>
                  <span className="font-semibold text-slate-100">{s.label}</span>
                </div>
                <p className="text-xs text-slate-500">{s.description}</p>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              {s.effects.map(e => (
                <div key={e} className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span style={{ color: s.color }}>•</span> {e}
                </div>
              ))}
            </div>
            <button onClick={() => handleInject(s.name)} disabled={injecting !== null}
              className="w-full py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-50"
              style={{ borderColor: `${s.color}40`, background: `${s.color}10`, color: s.color }}>
              {injecting === s.name ? "Injecting..." : `Inject (seed: ${seed})`}
            </button>
          </div>
        ))}
      </div>

      {/* Injection history */}
      {history.length > 0 && (
        <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
          <div className="label-xs text-slate-400 mb-3">Injection History (this session)</div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-3 text-xs text-slate-400">
                <span className="font-mono text-slate-600">{new Date(h.ts).toLocaleTimeString()}</span>
                <span className="text-warning">{h.name}</span>
                <span className="text-slate-600">seed={h.seed}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Replay */}
      <ScenarioReplay />
    </div>
  );
}

