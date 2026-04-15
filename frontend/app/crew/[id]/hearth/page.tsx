"use client";

import { useEffect, useState } from "react";
import { getZone } from "../../../../lib/api";

export default function HearthPage({ params }: { params: { id: string } }) {
  const [zone, setZone] = useState<any>(null);
  const [occupants] = useState(["Dr. Aisha Nkosi", "Dr. Kenji Watanabe"]);

  useEffect(() => {
    getZone("zone_soma_hearth").then(setZone).catch(() => {});
    const id = setInterval(() => getZone("zone_soma_hearth").then(setZone).catch(() => {}), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-light text-slate-100">Holographic Hearth</h2>
        <p className="text-slate-500 text-sm mt-1">The social fireplace — subliminally rewarding gathering space</p>
      </div>

      {/* Hearth visual */}
      <div className="border border-soma/30 rounded-2xl overflow-hidden bg-surface/50 p-8"
        style={{ boxShadow: "0 0 40px rgba(167,139,250,0.1)" }}>
        <div className="text-center space-y-4">
          <div className="text-8xl animate-float">🔥</div>
          <div>
            <div className="text-soma font-medium">Earth Forest — Kyoto, Japan</div>
            <div className="text-xs text-slate-500 mt-1">Ambient: soft rain, 38 dB · Running for 2h 14m</div>
          </div>
        </div>
      </div>

      {/* Current occupants (with consent) */}
      <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
        <div className="label-xs text-slate-400 mb-3">Currently at the Hearth</div>
        {occupants.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-4">No one here right now</div>
        ) : (
          <div className="space-y-2">
            {occupants.map(name => (
              <div key={name} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-soma/20 flex items-center justify-center text-soma text-xs">
                  {name.split(" ").pop()?.[0]}
                </div>
                <span className="text-slate-300">{name}</span>
                <span className="text-xs text-slate-600">· consent shared</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 text-xs text-slate-600 italic">
          Presence is only shown for crew who have consented to share location.
        </div>
      </div>

      {/* Environment */}
      {zone && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Ambient dB", value: `${zone.db_spl?.toFixed(0)} dB` },
            { label: "Warmth", value: `${zone.cct?.toFixed(0)} K` },
            { label: "Brightness", value: `${zone.lux?.toFixed(0)} lx` },
          ].map(m => (
            <div key={m.label} className="bg-surface-2 rounded-lg p-3 text-center">
              <div className="data-label mb-1">{m.label}</div>
              <div className="font-mono text-sm text-soma">{m.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
