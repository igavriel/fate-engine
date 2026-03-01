"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Slot = {
  slotIndex: number;
  isEmpty: boolean;
  character: { id: string; name: string; species: string; level: number } | null;
  updatedAt: string | null;
};

export default function SlotsPage() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/game/slots", { credentials: "include" });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) {
          const data = (await res.json()) as { error?: { message?: string } };
          setError(data.error?.message ?? "Failed to load slots");
          return;
        }
        const data = (await res.json()) as { slots: Slot[] };
        if (!cancelled) setSlots(data.slots);
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-zinc-400">Loading slots...</div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-100">Save Slots</h1>
      <p className="mt-1 text-zinc-400">Choose a slot to start or continue.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {slots?.map((slot) => (
          <div key={slot.slotIndex} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
            <div className="font-medium text-zinc-200">Slot {slot.slotIndex}</div>
            {slot.isEmpty ? (
              <>
                <p className="mt-2 text-sm text-zinc-500">Empty</p>
                <Link
                  href={`/create?slotIndex=${slot.slotIndex}`}
                  className="mt-4 block w-full rounded bg-emerald-600 py-2 text-center text-sm font-medium text-white hover:bg-emerald-500"
                >
                  New Game
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-zinc-300">{slot.character?.name}</p>
                <p className="text-xs text-zinc-500">
                  {slot.character?.species} · Level {slot.character?.level}
                </p>
                <Link
                  href={`/game?slotIndex=${slot.slotIndex}`}
                  className="mt-4 block w-full rounded bg-zinc-600 py-2 text-center text-sm font-medium text-zinc-100 hover:bg-zinc-500"
                >
                  Continue
                </Link>
              </>
            )}
          </div>
        ))}
      </div>
      <Link href="/" className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to home
      </Link>
    </div>
  );
}
