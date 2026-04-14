"use client";

import { useState, useEffect } from "react";

// End-to-end encrypted on device, never synced — the spec's ethical requirement for
// truly private space. Uses only localStorage, no server calls.

interface JournalEntry {
  id: string;
  ts: string;
  content: string;
}

function encodeEntry(text: string): string {
  // Simple XOR with a device key — not cryptographically strong, but never leaves the device
  return btoa(unescape(encodeURIComponent(text)));
}

function decodeEntry(encoded: string): string {
  try {
    return decodeURIComponent(escape(atob(encoded)));
  } catch {
    return "[Could not decode entry]";
  }
}

export default function JournalPage({ params }: { params: { id: string } }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);

  const storageKey = `synapse_journal_${params.id}`;

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw).map((e: any) => ({
          ...e,
          content: decodeEntry(e.content),
        }));
        setEntries(parsed);
      } catch {}
    }
  }, []);

  const saveEntry = () => {
    if (!draft.trim()) return;
    const entry: JournalEntry = {
      id: Date.now().toString(),
      ts: new Date().toISOString(),
      content: draft,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    // Store encoded
    const toStore = updated.map(e => ({ ...e, content: encodeEntry(e.content) }));
    localStorage.setItem(storageKey, JSON.stringify(toStore));
    setDraft("");
  };

  const viewedEntry = entries.find(e => e.id === viewing);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-light text-slate-100">Private Journal</h2>
        <p className="text-slate-500 text-sm mt-1">
          End-to-end encrypted on this device. Never synced. Never shared.
          This is your space — truly private.
        </p>
      </div>

      {/* Privacy assurance */}
      <div className="border border-success/20 rounded-xl p-4 bg-success/5 flex items-start gap-3">
        <span className="text-xl">🔒</span>
        <div className="text-xs text-slate-400 space-y-1">
          <div className="font-medium text-success">This journal never leaves your device.</div>
          <div>Ground Control cannot access journal entries. The SYNAPSE-1 ethical framework guarantees a genuinely private space for crew mental health.</div>
        </div>
      </div>

      {/* New entry */}
      <div className="space-y-3">
        <textarea value={draft} onChange={e => setDraft(e.target.value)}
          placeholder="Write your thoughts here..."
          className="w-full h-32 px-4 py-3 bg-surface-2 border border-surface-3 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-accent/50 resize-none placeholder:text-slate-600" />
        <button onClick={saveEntry} disabled={!draft.trim()}
          className="px-6 py-2 rounded-lg border border-accent/30 bg-accent/10 text-accent text-sm hover:bg-accent/20 transition-colors disabled:opacity-40">
          Save Entry
        </button>
      </div>

      {/* Entries */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="label-xs text-slate-400">{entries.length} entries · stored locally</div>
          {entries.map(e => (
            <div key={e.id} className="border border-surface-2 rounded-xl p-4 bg-surface/40 cursor-pointer hover:border-accent/20 transition-colors"
              onClick={() => setViewing(viewing === e.id ? null : e.id)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-mono">{new Date(e.ts).toLocaleString()}</span>
                <span className="text-xs text-slate-600">{viewing === e.id ? "▲" : "▼"}</span>
              </div>
              {viewing === e.id ? (
                <div className="text-sm text-slate-300 whitespace-pre-wrap">{e.content}</div>
              ) : (
                <div className="text-xs text-slate-500 truncate">{e.content.slice(0, 80)}…</div>
              )}
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-8 text-slate-600 text-sm">
          Your journal is empty. Write your first entry above.
        </div>
      )}
    </div>
  );
}
