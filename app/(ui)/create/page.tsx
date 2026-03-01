"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";

const SPECIES = ["HUMAN", "DWARF", "ELF", "MAGE"] as const;
const PLACEHOLDER_NAMES = ["Aria", "Bram", "Corin", "Dax", "Elara", "Finn", "Gwen", "Hugo"];

function randomName(): string {
  return PLACEHOLDER_NAMES[Math.floor(Math.random() * PLACEHOLDER_NAMES.length)] ?? "Hero";
}

function CreatePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slotIndex = searchParams.get("slotIndex");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<(typeof SPECIES)[number]>("HUMAN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) setName(randomName());
  }, [name]);

  const validSlot = slotIndex && ["1", "2", "3"].includes(slotIndex);
  const slotNum = validSlot ? parseInt(slotIndex, 10) : 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slotIndex: slotNum,
          name: name.trim(),
          species,
        }),
      });
      const data = (await res.json()) as { error?: { message?: string }; characterId?: string };
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to create character");
        return;
      }
      router.push(`/game?slotIndex=${slotNum}`);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!validSlot) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="text-red-400">Invalid slot. Choose from slot 1, 2, or 3.</p>
        <Link href="/slots" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200">
          ← Back to slots
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-100">Create Character</h1>
      <p className="mt-1 text-zinc-400">Slot {slotNum}</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm text-zinc-400">
            Name
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={24}
              required
              className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
            />
            <button
              type="button"
              onClick={() => setName(randomName())}
              className="rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              Randomize
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="species" className="block text-sm text-zinc-400">
            Species
          </label>
          <select
            id="species"
            value={species}
            onChange={(e) => setSpecies(e.target.value as (typeof SPECIES)[number])}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          >
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create & Enter Game"}
        </button>
      </form>
      <Link href="/slots" className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to slots
      </Link>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={<div className="mx-auto max-w-md px-4 py-12 text-zinc-400">Loading...</div>}
    >
      <CreatePageInner />
    </Suspense>
  );
}
