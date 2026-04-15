"use client";

import { useEffect, useState } from "react";
import { getAllCrew, getCircadianForecast } from "@/lib/api";
import type { Crew, CircadianForecastPoint } from "@/lib/types";
import { getCircadianDebtColor } from "@/lib/utils";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, ReferenceLine, Tooltip } from "recharts";

function CircadianRing({ phase, debt, schedule, diameter = 120 }: {
  phase: number; debt: number; schedule: number; diameter?: number;
}) {
  const cx = diameter / 2, cy = diameter / 2;
  const outerR = diameter / 2 - 6;
  const innerR = diameter / 2 - 18;
  const debtColor = getCircadianDebtColor(debt);

  const angleToXY = (angle: number, r: number) => ({
    x: cx + r * Math.cos(angle - Math.PI / 2),
    y: cy + r * Math.sin(angle - Math.PI / 2),
  });

  const scheduleAngle = (schedule / 24) * 2 * Math.PI;
  const phaseAngle = (phase / 24) * 2 * Math.PI;

  const arcPath = (r: number, endAngle: number) => {
    const end = angleToXY(endAngle, r);
    const large = endAngle > Math.PI ? 1 : 0;
    return `M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  // Gap = debt
  const gapAngle = (debt / 24) * 2 * Math.PI;

  return (
    <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
      {/* Outer ring: schedule (gray) */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#1e293b" strokeWidth="5" />
      <path d={arcPath(outerR, scheduleAngle)} fill="none" stroke="#334155" strokeWidth="5" strokeLinecap="round" />

      {/* Inner ring: biological phase */}
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#0f172a" strokeWidth="5" />
      <path d={arcPath(innerR, phaseAngle)} fill="none" stroke={debtColor} strokeWidth="5" strokeLinecap="round" />

      {/* Debt gap (shaded red) */}
      {debt > 0.5 && (
        <path d={`M ${cx} ${cy} L ${angleToXY(phaseAngle, outerR).x} ${angleToXY(phaseAngle, outerR).y} A ${outerR} ${outerR} 0 ${gapAngle > Math.PI ? 1 : 0} 1 ${angleToXY(scheduleAngle, outerR).x} ${angleToXY(scheduleAngle, outerR).y} Z`}
          fill="rgba(239,68,68,0.1)" />
      )}

      {/* Center text */}
      <text x={cx} y={cy - 4} textAnchor="middle" fill={debtColor} fontSize="11" fontFamily="monospace" fontWeight="bold">
        {debt.toFixed(1)}h
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill="#64748b" fontSize="8">debt</text>
    </svg>
  );
}

export default function CircadianPage() {
  const [crew, setCrew] = useState<Crew[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [forecast, setForecast] = useState<CircadianForecastPoint[]>([]);

  useEffect(() => {
    getAllCrew().then(setCrew).catch(() => {});
    const id = setInterval(() => getAllCrew().then(setCrew).catch(() => {}), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selected) return;
    getCircadianForecast(selected).then(d => setForecast(d.forecast || [])).catch(() => {});
  }, [selected]);

  const currentHour = (Date.now() / 1000 / 3600) % 24;
  const criticalCrew = crew.filter(c => c.circadian && c.circadian.debt_hours > 2);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Circadian Intelligence</h1>
        <p className="text-slate-500 text-sm mt-1">
          Kronauer-style van der Pol oscillator per crew member.
          Outer ring = habitat schedule, Inner ring = biological phase.
          Shaded gap = circadian debt.
          Warning threshold: 2 hours.
        </p>
      </div>

      {criticalCrew.length > 0 && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-4">
          <div className="flex items-center gap-2 text-danger text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            Circadian debt &gt;2h detected:
            {criticalCrew.map(c => <span key={c.crew_id} className="ml-2">{c.display_name.split(" ").pop()}</span>)}
          </div>
          <div className="text-xs text-danger/70 mt-1">
            Lighting autopilot adjusting pod CCT to accelerate realignment.
          </div>
        </div>
      )}

      {/* Crew rings grid */}
      <div className="grid grid-cols-6 gap-3">
        {crew.map(c => {
          const circ = c.circadian;
          const isSelected = selected === c.crew_id;
          return (
            <button key={c.crew_id} onClick={() => setSelected(isSelected ? null : c.crew_id)}
              className={`border rounded-xl p-3 text-center transition-all ${isSelected ? "border-accent/50 bg-accent/5" : "border-surface-2 bg-surface/40 hover:border-accent/20"}`}>
              <div className="flex justify-center mb-1">
                <CircadianRing
                  phase={circ?.phase_hours ?? currentHour}
                  debt={circ?.debt_hours ?? 0}
                  schedule={currentHour}
                  diameter={80}
                />
              </div>
              <div className="text-xs text-slate-300">{c.display_name.split(" ").pop()}</div>
              <div className="text-xs text-slate-500">{circ?.alertness ? `${(circ.alertness * 100).toFixed(0)}% alert` : "–"}</div>
            </button>
          );
        })}
      </div>

      {/* Selected crew forecast */}
      {selected && forecast.length > 0 && (
        <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
          <div className="label-xs text-slate-400 mb-3">
            16h Alertness Forecast · {crew.find(c => c.crew_id === selected)?.display_name}
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="alertGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="hour_offset" stroke="#334155" tick={{ fontSize: 10 }}
                tickFormatter={(v) => `+${v}h`} />
              <YAxis stroke="#334155" tick={{ fontSize: 10 }} domain={[0, 1]}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px" }}
                formatter={(v: number) => [`${(v * 100).toFixed(0)}%`, "Alertness"]} />
              <ReferenceLine y={0.5} stroke="#334155" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="alertness" stroke="#06b6d4" fill="url(#alertGrad2)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 text-xs text-slate-500 space-y-1">
            <div>Phase shift demo: change this crew's pod CCT to Vedic Ochre (2000K) and watch phase drift over next 3 simulated hours.</div>
            <div className="text-slate-600 italic">Model: Kronauer 1999 van der Pol oscillator · St Hilaire 2007 phototransduction</div>
          </div>
        </div>
      )}
    </div>
  );
}

