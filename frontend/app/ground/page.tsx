"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore, useHabitatStore, useBiometricsStore, useCrewStore, useUIStore } from "@/lib/store";
import { getAllCrew, getShieldIntegrity, getAllSMIs, getCommsStatus, injectScenario, getEthicsLog, getCohesionHeatmap } from "@/lib/api";
import { createEnvWS, createBioWS } from "@/lib/api";
import { getCircadianDebtColor, getMoodWeather, getMoodEmoji } from "@/lib/utils";
import type { Crew, ShieldIntegrity, CommsStatus, EthicsLogEntry } from "@/lib/types";
import Link from "next/link";

// ─── Alert Banner ─────────────────────────────────────────────────────────────
function AlertBanner({ message, type, onDismiss }: { message: string; type: string; onDismiss: () => void }) {
  const color = type === "critical" ? "danger" : type === "warning" ? "warning" : "accent";
  return (
    <div className={`alert-banner flex items-center justify-between px-4 py-2 border-b ${type === "critical" ? "bg-danger/10 border-danger/30 text-danger" : "bg-warning/10 border-warning/30 text-warning"}`}>
      <div className="flex items-center gap-2 text-sm">
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        {message}
      </div>
      <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100 ml-4">✕</button>
    </div>
  );
}

// ─── Habitat Vitals ───────────────────────────────────────────────────────────
function HabitatVitals({ shield }: { shield: ShieldIntegrity | null }) {
  const vitals = [
    { label: "O₂ Level", value: "21.0%", status: "nominal" },
    { label: "CO₂", value: "0.08%", status: "nominal" },
    { label: "Pressure", value: "101.3 kPa", status: "nominal" },
    { label: "Power Draw", value: "148 kW", status: "nominal" },
    { label: "Water Reserve", value: shield ? `${shield.effective_mass_kg.toLocaleString()} kg` : "–", status: shield?.shield_status === "NOMINAL" ? "nominal" : "warning" },
    { label: "Shield Integrity", value: shield ? `${shield.shield_effectiveness_pct}%` : "–", status: shield?.shield_status === "NOMINAL" ? "nominal" : shield?.shield_status === "DEGRADED" ? "warning" : "critical" },
  ];

  return (
    <div className="grid grid-cols-6 gap-3">
      {vitals.map((v) => (
        <div key={v.label} className="border border-surface-2 rounded-xl p-3 bg-surface/50">
          <div className="data-label mb-1">{v.label}</div>
          <div className={`font-mono text-sm font-semibold ${v.status === "nominal" ? "text-success" : v.status === "warning" ? "text-warning" : "text-danger"}`}>
            {v.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Shield vs Consumption dial ───────────────────────────────────────────────
function ShieldDial({ shield }: { shield: ShieldIntegrity | null }) {
  if (!shield) return null;
  const pct = shield.shield_effectiveness_pct;
  const color = pct > 70 ? "#10b981" : pct > 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
      <div className="label-xs text-slate-400 mb-3">Water Shield vs Consumption</div>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${pct * 2.01} 201`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-lg font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
          </div>
        </div>
        <div className="space-y-1 text-xs">
          <div><span className="text-slate-500">Total: </span><span className="text-slate-300 font-mono">{shield.water_mass_kg.toLocaleString()} kg</span></div>
          <div><span className="text-slate-500">Consumed: </span><span className="text-warning font-mono">{shield.consumed_kg.toLocaleString()} kg</span></div>
          <div><span className="text-slate-500">Status: </span><span style={{ color }}>{shield.shield_status}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Crew Roster Card ─────────────────────────────────────────────────────────
function CrewCard({ crew }: { crew: Crew }) {
  const bio = crew.bio;
  const circ = crew.circadian;
  const affect = crew.affect;
  const paused = crew.privacy_paused;

  const debtColor = circ ? getCircadianDebtColor(circ.debt_hours) : "#94a3b8";
  const mood = affect && !paused ? getMoodEmoji(affect.arousal, affect.valence) : null;

  return (
    <div className="border border-surface-2 rounded-xl p-3 bg-surface/40 card-hover hover:border-accent/30 transition-all">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-xs font-semibold text-slate-200">{crew.display_name}</div>
          <div className="text-xs text-slate-500">{crew.role}</div>
        </div>
        <div className="text-lg" title={paused ? "Sharing paused" : getMoodWeather(affect?.arousal ?? 0, affect?.valence ?? 0)}>
          {paused ? "🔒" : (mood ?? "○")}
        </div>
      </div>

      {paused ? (
        <div className="text-xs text-warning bg-warning/10 rounded px-2 py-1 text-center">
          Sharing paused by crew
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div>
            <div className="data-label">HRV</div>
            <div className="font-mono text-accent">{bio?.hrv_rmssd?.toFixed(0) ?? "–"} ms</div>
          </div>
          <div>
            <div className="data-label">HR</div>
            <div className="font-mono text-accent">{bio?.hr?.toFixed(0) ?? "–"} bpm</div>
          </div>
          <div>
            <div className="data-label">Circadian Debt</div>
            <div className="font-mono text-sm" style={{ color: debtColor }}>
              {circ?.debt_hours?.toFixed(1) ?? "–"}h
            </div>
          </div>
          <div>
            <div className="data-label">Sleep Debt</div>
            <div className="font-mono text-sm text-slate-400">{bio?.sleep_debt?.toFixed(1) ?? "–"}h</div>
          </div>
        </div>
      )}

      {circ && circ.debt_hours > 2 && !paused && (
        <div className="mt-2 text-xs text-danger bg-danger/10 rounded px-2 py-0.5 text-center">
          ⚠ Circadian debt critical
        </div>
      )}
    </div>
  );
}

// ─── Scenario Control ─────────────────────────────────────────────────────────
function ScenarioPanel() {
  const { token } = useAuthStore();
  const [seed, setSeed] = useState(42);
  const [injecting, setInjecting] = useState<string | null>(null);
  const [lastInjected, setLastInjected] = useState<string | null>(null);

  const scenarios = [
    { name: "SolarProtonEvent", label: "Solar Proton Event", icon: "☀", color: "danger", desc: "SPE stress cascade across all crew" },
    { name: "CommsBlackout", label: "Comms Blackout", icon: "📡", color: "warning", desc: "Earth link lost — isolation stress" },
    { name: "InterpersonalConflict", label: "Interpersonal Conflict", icon: "⚡", color: "warning", desc: "Social friction in Soma ring" },
    { name: "EquipmentFailure", label: "Equipment Failure", icon: "⚙", color: "danger", desc: "Systems emergency — acute stress" },
  ];

  const handleInject = async (name: string) => {
    setInjecting(name);
    try {
      await injectScenario(name, seed);
      setLastInjected(name);
      setTimeout(() => setLastInjected(null), 5000);
    } catch (e) {}
    finally { setInjecting(null); }
  };

  return (
    <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
      <div className="label-xs text-slate-400 mb-3">Scenario Injection · GROUND ONLY</div>
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-slate-500">Seed:</label>
        <input type="number" value={seed} onChange={(e) => setSeed(parseInt(e.target.value) || 42)}
          className="w-20 px-2 py-1 bg-surface-2 border border-surface-3 rounded text-xs font-mono text-slate-300 focus:outline-none focus:border-accent" />
      </div>
      <div className="space-y-2">
        {scenarios.map((s) => (
          <button key={s.name} onClick={() => handleInject(s.name)}
            disabled={injecting !== null}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${lastInjected === s.name ? "border-success/50 bg-success/10 text-success" : s.color === "danger" ? "border-danger/30 bg-danger/5 hover:bg-danger/10 text-danger" : "border-warning/30 bg-warning/5 hover:bg-warning/10 text-warning"} disabled:opacity-50`}>
            <span>{s.icon} {s.label}</span>
            <span className="text-slate-600">{s.desc}</span>
          </button>
        ))}
      </div>
      {lastInjected && (
        <div className="mt-2 text-xs text-success text-center">✓ {lastInjected} injected</div>
      )}
    </div>
  );
}

// ─── Predictive Friction Panel ────────────────────────────────────────────────
function FrictionPanel({ crew }: { crew: Crew[] }) {
  const risks = crew
    .flatMap((c1, i) => crew.slice(i + 1).map((c2) => {
      const debt1 = c1.circadian?.debt_hours ?? 0;
      const debt2 = c2.circadian?.debt_hours ?? 0;
      const sdDebt1 = c1.bio?.sleep_debt ?? 0;
      const sdDebt2 = c2.bio?.sleep_debt ?? 0;
      const score = (debt1 + debt2) / 2 + (sdDebt1 + sdDebt2) / 4;
      if (score < 1.5) return null;
      return {
        c1: c1.display_name.split(" ").pop(),
        c2: c2.display_name.split(" ").pop(),
        score,
        reasons: [
          debt1 > 2 ? `${c1.display_name.split(" ").pop()} circadian debt ${debt1.toFixed(1)}h` : null,
          debt2 > 2 ? `${c2.display_name.split(" ").pop()} circadian debt ${debt2.toFixed(1)}h` : null,
          (sdDebt1 + sdDebt2) > 3 ? `Combined sleep debt ${(sdDebt1 + sdDebt2).toFixed(1)}h` : null,
        ].filter(Boolean) as string[],
      };
    }))
    .filter(Boolean)
    .sort((a, b) => b!.score - a!.score)
    .slice(0, 5);

  return (
    <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
      <div className="label-xs text-slate-400 mb-3">Predictive Friction · ML Estimates</div>
      {risks.length === 0 ? (
        <div className="text-xs text-success text-center py-3">No friction risks detected</div>
      ) : (
        <div className="space-y-2">
          {risks.map((r, i) => r && (
            <div key={i} className="border border-warning/20 rounded-lg p-2 bg-warning/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-warning font-mono">{r.c1} ↔ {r.c2}</span>
                <span className="text-xs text-slate-500">Risk: {r.score.toFixed(1)}</span>
              </div>
              <div className="space-y-0.5">
                {r.reasons.map((reason, j) => (
                  <div key={j} className="text-xs text-slate-400">• {reason}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 text-xs text-slate-600 italic">
        Attributions: circadian debt, sleep debt, schedule overlap
      </div>
    </div>
  );
}

// ─── Ethics Recent ────────────────────────────────────────────────────────────
function RecentEthics({ entries }: { entries: EthicsLogEntry[] }) {
  return (
    <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
      <div className="flex items-center justify-between mb-3">
        <div className="label-xs text-slate-400">Ethics Ledger · Recent</div>
        <Link href="/ground/ethics" className="text-xs text-accent hover:underline">View all →</Link>
      </div>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {entries.slice(0, 8).map((e) => (
          <div key={e.id} className="flex items-start gap-2 text-xs">
            <span className="text-slate-600 font-mono shrink-0">{new Date(e.ts).toLocaleTimeString("en-US", { hour12: false })}</span>
            <span className={`shrink-0 px-1.5 rounded text-xs ${e.actor_role === "GROUND" ? "bg-accent/10 text-accent" : "bg-blue-500/10 text-blue-400"}`}>
              {e.actor_role}
            </span>
            <span className="text-slate-400">{e.event_type}</span>
          </div>
        ))}
        {entries.length === 0 && <div className="text-xs text-slate-600 text-center py-2">No entries yet</div>}
      </div>
    </div>
  );
}

// ─── Main Ground Dashboard ─────────────────────────────────────────────────────
export default function GroundDashboard() {
  const { token } = useAuthStore();
  const [crew, setCrew] = useState<Crew[]>([]);
  const [shield, setShield] = useState<ShieldIntegrity | null>(null);
  const [smis, setSmis] = useState<Record<string, { smi: number; alarm: boolean }>>({});
  const [comms, setComms] = useState<CommsStatus | null>(null);
  const [ethics, setEthics] = useState<EthicsLogEntry[]>([]);
  const [alerts, setAlerts] = useState<Array<{ id: string; msg: string; type: string }>>([]);
  const { updateEnvBatch } = useHabitatStore();
  const { updateBio, setPrivacyBlocked } = useBiometricsStore();

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [crewData, shieldData, smiData, commsData, ethicsData] = await Promise.all([
        getAllCrew(),
        getShieldIntegrity(),
        getAllSMIs(),
        getCommsStatus(),
        getEthicsLog(),
      ]);
      setCrew(crewData);
      setShield(shieldData);
      setSmis(smiData);
      setComms(commsData);
      setEthics(ethicsData);

      // Check for circadian debt alerts
      const debtCrew = crewData.filter((c: Crew) => c.circadian && c.circadian.debt_hours > 2);
      if (debtCrew.length > 0) {
        const id = `debt-${Date.now()}`;
        setAlerts((prev) => {
          if (prev.find(a => a.id.startsWith("debt"))) return prev;
          return [...prev, { id, msg: `Circadian debt >2h: ${debtCrew.map((c: Crew) => c.display_name.split(" ").pop()).join(", ")}`, type: "warning" }];
        });
      }
    } catch (e) {}
  }, [token]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 5000);
    return () => clearInterval(id);
  }, [fetchData]);

  // WebSocket for env
  useEffect(() => {
    if (!token) return;
    const ws = createEnvWS(token, (msg: any) => {
      if (msg.type === "env_update") {
        updateEnvBatch(msg.data);
      }
    });
    return () => ws.close();
  }, [token]);

  // WebSockets for all crew bio
  useEffect(() => {
    if (!token) return;
    const sockets = Array.from({ length: 12 }, (_, i) => {
      const crewId = `crew${String(i + 1).padStart(2, "0")}`;
      return createBioWS(crewId, token, (msg: any) => {
        if (msg.type === "bio_update") updateBio(msg.crew_id, msg.data);
        if (msg.type === "blocked") setPrivacyBlocked(crewId, true);
      });
    });
    return () => sockets.forEach((s) => s.close());
  }, [token]);

  const smiAlarms = Object.entries(smis).filter(([, v]) => v.alarm);

  return (
    <div className="p-4 space-y-4 max-w-[1800px] mx-auto">
      {/* Alert banners */}
      {alerts.map((a) => (
        <AlertBanner key={a.id} message={a.msg} type={a.type}
          onDismiss={() => setAlerts((p) => p.filter((x) => x.id !== a.id))} />
      ))}
      {smiAlarms.length > 0 && (
        <AlertBanner message={`Sensory Monotony Index alarm: ${smiAlarms.map(([id]) => id.replace("zone_", "")).join(", ")}`} type="warning"
          onDismiss={() => setSmis((prev) => {
            const next = { ...prev };
            smiAlarms.forEach(([id]) => { next[id] = { ...next[id], alarm: false }; });
            return next;
          })} />
      )}

      {/* Top: Habitat Vitals */}
      <section>
        <div className="label-xs text-slate-500 mb-2">Habitat Vitals</div>
        <HabitatVitals shield={shield} />
      </section>

      {/* Main grid: 3 columns */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Crew roster */}
        <div className="col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="label-xs text-slate-400">Crew Roster · 12 Personnel</div>
            <Link href="/ground/crew" className="text-xs text-accent hover:underline">Detail →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {crew.map((c) => <CrewCard key={c.crew_id} crew={c} />)}
          </div>
        </div>

        {/* Centre: 3D Viewer + SMI */}
        <div className="col-span-6 space-y-3">
          <div className="border border-surface-2 rounded-xl overflow-hidden bg-surface/50"
            style={{ height: "400px" }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-surface-2">
              <div className="label-xs text-slate-400">Habitat 3D Viewer</div>
              <Link href="/ground/habitat" className="text-xs text-accent hover:underline">Full view →</Link>
            </div>
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <div className="text-4xl">◈</div>
                <p className="text-slate-400 text-sm">3D Habitat Viewer</p>
                <Link href="/ground/habitat"
                  className="inline-block px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent text-xs hover:bg-accent/20 transition-colors">
                  Open Full Viewer →
                </Link>
              </div>
            </div>
          </div>

          {/* SMI grid */}
          <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
            <div className="label-xs text-slate-400 mb-3">Sensory Monotony Index · All Zones</div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(smis).slice(0, 8).map(([zoneId, data]) => (
                <div key={zoneId} className={`rounded-lg p-2 border text-center ${data.alarm ? "border-warning/50 bg-warning/10" : "border-surface-2 bg-surface/30"}`}>
                  <div className="text-xs text-slate-500 truncate">{zoneId.replace("zone_", "").replace("_", " ")}</div>
                  <div className={`font-mono text-sm ${data.alarm ? "text-warning" : "text-success"}`}>
                    {(data.smi * 100).toFixed(0)}%
                  </div>
                  {data.alarm && <div className="text-xs text-warning">⚠ LOW</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Friction + Scenario + Shield */}
        <div className="col-span-3 space-y-3">
          <FrictionPanel crew={crew} />
          <ShieldDial shield={shield} />
          <ScenarioPanel />

          {/* Comms status */}
          {comms && (
            <div className="border border-surface-2 rounded-xl p-3 bg-surface/50">
              <div className="label-xs text-slate-400 mb-2">Earth Comms</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-slate-500">Latency: </span><span className="font-mono text-accent">{comms.one_way_latency_s}s</span></div>
                <div><span className="text-slate-500">Status: </span><span className={comms.status === "NOMINAL" ? "text-success" : "text-warning"}>{comms.status}</span></div>
                <div><span className="text-slate-500">Mission Day: </span><span className="font-mono text-slate-300">{comms.mission_day}</span></div>
                <div><span className="text-slate-500">Next window: </span><span className="font-mono text-slate-300">{Math.floor(comms.next_window_s / 60)}m</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Ethics + Crew links */}
      <div className="grid grid-cols-2 gap-4">
        <RecentEthics entries={ethics} />
        <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
          <div className="label-xs text-slate-400 mb-3">Quick Navigation</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/ground/habitat", label: "3D Habitat Viewer" },
              { href: "/ground/circadian", label: "Circadian Dashboard" },
              { href: "/ground/crew", label: "Full Crew Biometrics" },
              { href: "/ground/scenarios", label: "Scenario Replay" },
              { href: "/ground/ethics", label: "Ethics Ledger" },
              { href: "/ground/comms", label: "Comms & ISRU" },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="px-3 py-2 rounded-lg border border-surface-2 text-xs text-slate-400 hover:border-accent/30 hover:text-accent transition-all">
                {link.label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
