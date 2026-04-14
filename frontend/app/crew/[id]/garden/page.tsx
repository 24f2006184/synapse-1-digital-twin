"use client";

import { useState } from "react";

const PLANTS = ["Bonsai Juniper", "Micro-basil", "Moss Garden", "Dwarf Bamboo"];

export default function GardenPage({ params }: { params: { id: string } }) {
  const [lastWatered, setLastWatered] = useState<string | null>(null);
  const [lastPruned, setLastPruned] = useState<string | null>(null);
  const [growth, setGrowth] = useState(62);

  const plantIndex = parseInt(params.id.replace("crew", "")) % PLANTS.length;
  const plant = PLANTS[plantIndex];

  const handleWater = () => {
    setLastWatered(new Date().toLocaleTimeString());
    setGrowth(g => Math.min(100, g + 3));
  };

  const handlePrune = () => {
    setLastPruned(new Date().toLocaleTimeString());
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-light text-slate-100">Aeroponic Garden</h2>
        <p className="text-slate-500 text-sm mt-1">Attention Restoration Theory — made tangible</p>
      </div>

      {/* Plant display */}
      <div className="border border-axon/30 rounded-2xl p-8 bg-surface/50 text-center space-y-4"
        style={{ boxShadow: "0 0 30px rgba(52,211,153,0.08)" }}>
        <div className="text-7xl animate-float">🌿</div>
        <div>
          <div className="text-axon font-medium text-lg">{plant}</div>
          <div className="text-xs text-slate-500 mt-1">Your adopted plant · Station 4-B</div>
        </div>
        {/* Growth bar */}
        <div className="max-w-48 mx-auto">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Growth</span><span>{growth}%</span>
          </div>
          <div className="h-2 bg-surface-2 rounded-full">
            <div className="h-2 bg-axon rounded-full transition-all duration-1000"
              style={{ width: `${growth}%` }} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={handleWater}
          className="py-4 rounded-xl border border-axon/30 bg-axon/10 text-axon hover:bg-axon/20 transition-colors">
          <div className="text-2xl mb-1">💧</div>
          <div className="text-sm font-medium">Water</div>
          {lastWatered && <div className="text-xs text-slate-500 mt-1">{lastWatered}</div>}
        </button>
        <button onClick={handlePrune}
          className="py-4 rounded-xl border border-surface-2 bg-surface/50 text-slate-400 hover:border-axon/30 hover:text-axon transition-colors">
          <div className="text-2xl mb-1">✂️</div>
          <div className="text-sm font-medium">Prune</div>
          {lastPruned && <div className="text-xs text-slate-500 mt-1">{lastPruned}</div>}
        </button>
      </div>

      {/* ART note */}
      <div className="border border-surface-2 rounded-xl p-4 bg-surface/50">
        <div className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-300">Attention Restoration Theory (ART)</strong> — Kaplan & Kaplan 1989.
          Tending a plant provides restorative attention: effortless engagement that replenishes directed attention capacity.
          Your care actions are a positive-valence event in the affect model.
          <span className="text-slate-600 italic ml-1">(documented assumption, not a clinical claim)</span>
        </div>
      </div>
    </div>
  );
}
