"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { defaultPreferences, runAgent, settleDueDemoEvents } from "@/lib/agent";
import { createPosition } from "@/lib/simulation";
import type { AgentRun, Preferences } from "@/lib/domain";
import { loadDemoSnapshot, saveDemoSnapshot } from "@/lib/storage";

type Store = { preferences: Preferences; run: AgentRun | null; handledCandidateIds: string[] };
type AgentContextValue = Store & { hydrated: boolean; savePreferences: (value: Preferences) => void; startAgent: (value?: Preferences) => void; addToSimulation: (candidateId: string) => void; dismissPick: (candidateId: string) => void; resetDemo: () => void };
const AgentContext = createContext<AgentContextValue | null>(null);

function initialStore(): Store { return { preferences: { ...defaultPreferences, categories: [...defaultPreferences.categories], interests: [...defaultPreferences.interests] }, run: null, handledCandidateIds: [] }; }

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(initialStore);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const saved = loadDemoSnapshot();
      if (saved) setStore({ ...saved, handledCandidateIds: saved.handledCandidateIds ?? [], run: saved.run ? settleDueDemoEvents(saved.run) : null });
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { if (hydrated) saveDemoSnapshot(store); }, [store, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setInterval(() => {
      setStore((current) => {
        if (!current.run) return current;
        const settled = settleDueDemoEvents(current.run);
        return settled === current.run ? current : { ...current, run: settled };
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [hydrated]);
  const savePreferences = useCallback((preferences: Preferences) => setStore((current) => ({ ...current, preferences })), []);
  const startAgent = useCallback((preferences?: Preferences) => {
    const selected = preferences ?? store.preferences;
    const next = { preferences: selected, run: runAgent(selected), handledCandidateIds: [] };
    saveDemoSnapshot(next);
    setStore(next);
  }, [store.preferences]);
  const addToSimulation = useCallback((candidateId: string) => {
    setStore((current) => {
      if (!current.run) return current;
      const entry = current.run.evaluated.find((item) => item.candidate.id === candidateId);
      if (!entry) return current;
      const position = createPosition(entry, current.run.availableCredits, current.run.positions, new Date().toISOString());
      if (!position) return current;
      const nextRun = {
        ...current.run,
        positions: [...current.run.positions, position],
        availableCredits: current.run.availableCredits - position.virtualAllocation,
      };
      return { ...current, run: nextRun };
    });
  }, []);
  const dismissPick = useCallback((candidateId: string) => {
    setStore((current) => current.handledCandidateIds.includes(candidateId)
      ? current
      : { ...current, handledCandidateIds: [...current.handledCandidateIds, candidateId] });
  }, []);
  const resetDemo = useCallback(() => { const next = initialStore(); saveDemoSnapshot(next); setStore(next); }, []);
  const value = useMemo(() => ({ ...store, hydrated, savePreferences, startAgent, addToSimulation, dismissPick, resetDemo }), [store, hydrated, savePreferences, startAgent, addToSimulation, dismissPick, resetDemo]);
  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}
export function useAgent() { const context = useContext(AgentContext); if (!context) throw new Error("useAgent must be used inside AgentProvider"); return context; }
