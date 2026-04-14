"use client";

import { useState, useEffect, useCallback } from "react";
import { submitHippocampalTest } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

// Hippocampal Anchor Drift Test
// 60-second spatial memory mini-game in the atrium.
// Performance is a proxy for grid-cell function under sustained 1/6 g.
// Validated in spaceflight analog literature: Clément et al.
// NOTE: Declining scores flag need for increased biophilic/anchor interventions.
// This is a hypothesis, not a confirmed fact — grid-cell transfer to 1/6g is unproven in humans.

const GRID_SIZE = 4;
const SEQUENCE_LENGTH = 5;
const SHOW_MS = 800;

type Phase = "intro" | "memorise" | "recall" | "result";

function generateSequence(): number[] {
  const seq: number[] = [];
  while (seq.length < SEQUENCE_LENGTH) {
    const n = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
    if (!seq.includes(n)) seq.push(n);
  }
  return seq;
}

export default function AnchorTestPage({ params }: { params: { id: string } }) {
  const { token } = useAuthStore();
  const [phase, setPhase] = useState<Phase>("intro");
  const [sequence, setSequence] = useState<number[]>([]);
  const [showIndex, setShowIndex] = useState(-1);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [startTs, setStartTs] = useState(0);
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const startTest = useCallback(() => {
    const seq = generateSequence();
    setSequence(seq);
    setShowIndex(0);
    setUserInput([]);
    setPhase("memorise");
    setStartTs(Date.now());
  }, []);

  useEffect(() => {
    if (phase !== "memorise") return;
    if (showIndex >= sequence.length) {
      setTimeout(() => setPhase("recall"), 500);
      return;
    }
    const id = setTimeout(() => setShowIndex(i => i + 1), SHOW_MS);
    return () => clearTimeout(id);
  }, [phase, showIndex, sequence.length]);

  const handleCellClick = (cellIdx: number) => {
    if (phase !== "recall") return;
    const next = [...userInput, cellIdx];
    setUserInput(next);
    if (next.length === SEQUENCE_LENGTH) {
      const correct = next.filter((v, i) => v === sequence[i]).length;
      const pct = (correct / SEQUENCE_LENGTH) * 100;
      const elapsed = Date.now() - startTs;
      setScore(pct);

      if (token) {
        submitHippocampalTest(params.id, {
          score: pct,
          reaction_time_ms: elapsed / SEQUENCE_LENGTH,
          accuracy_pct: pct,
        }).catch(() => {});
        setSubmitted(true);
      }

      setPhase("result");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-light text-slate-100">Hippocampal Anchor Test</h2>
        <p className="text-slate-500 text-sm mt-1">
          Weekly 60-second spatial memory assessment — grid-cell function proxy
        </p>
      </div>

      {/* Science note */}
      <div className="border border-surface-2 rounded-xl p-4 bg-surface/50 text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-300">Scientific note:</strong> Grid-cell spatial navigation research (Moser et al.)
        is established in rodents and 1g humans. Transfer to 1/6g sustained habitation is a hypothesis, not proven fact.
        Declining scores here flag a need for increased biophilic and anchor interventions — they do not diagnose anything.
        <span className="text-slate-600 italic ml-1">(Clément et al., spaceflight analog literature)</span>
      </div>

      {phase === "intro" && (
        <div className="text-center space-y-4">
          <div className="text-6xl">◈</div>
          <p className="text-slate-400">Remember the sequence of highlighted cells in the spatial grid.</p>
          <p className="text-xs text-slate-500">{SEQUENCE_LENGTH} cells will light up. Recall them in order.</p>
          <button onClick={startTest}
            className="px-8 py-3 rounded-xl bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors">
            Begin Test
          </button>
        </div>
      )}

      {(phase === "memorise" || phase === "recall") && (
        <div className="space-y-4">
          <div className="text-center text-sm text-slate-400">
            {phase === "memorise" ? "Memorise the sequence..." : `Recall: ${userInput.length}/${SEQUENCE_LENGTH}`}
          </div>
          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
            {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
              const isActive = phase === "memorise" && showIndex < sequence.length && sequence[showIndex] === i;
              const isRecalled = userInput.includes(i);
              const isCorrect = isRecalled && sequence[userInput.indexOf(i)] === i;

              return (
                <button key={i} onClick={() => handleCellClick(i)}
                  disabled={phase !== "recall" || isRecalled}
                  className={`aspect-square rounded-lg border transition-all duration-200 ${
                    isActive ? "bg-accent border-accent shadow-glow scale-110"
                    : isRecalled ? (isCorrect ? "bg-success/30 border-success" : "bg-danger/30 border-danger")
                    : "border-surface-2 bg-surface/40 hover:border-accent/40 hover:bg-accent/10"
                  }`}>
                  <span className="text-xs font-mono text-slate-500">{i + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "result" && (
        <div className="text-center space-y-4">
          <div className={`text-5xl font-bold font-mono ${score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-danger"}`}>
            {score.toFixed(0)}%
          </div>
          <div className="text-slate-400">
            {score >= 80 ? "Excellent spatial recall" : score >= 60 ? "Good performance" : "Below baseline — consider more time at the atrium"}
          </div>
          {score < 60 && (
            <div className="text-xs text-slate-500 bg-surface-2 rounded-lg p-3">
              Recommendation: Spend 15+ minutes in the Hippocampal Anchor Atrium today.
              Novel spatial exploration supports grid-cell function.
            </div>
          )}
          {submitted && (
            <div className="text-xs text-success">✓ Score recorded</div>
          )}
          <button onClick={() => setPhase("intro")}
            className="px-6 py-2 rounded-lg border border-surface-2 text-slate-400 hover:border-accent/30 hover:text-accent transition-colors">
            Test again
          </button>
        </div>
      )}
    </div>
  );
}
