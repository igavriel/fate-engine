"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { TitleSigil } from "@/src/ui/components/TitleSigil";
import { Frame } from "@/src/ui/components/Frame";
import { actionLabels, labels, vesselOrdinal, screenCopy } from "@/src/ui/theme/copy";
import { card, buttonPrimary, buttonGhost } from "@/src/ui/theme/classnames";

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
      <div className="mx-auto max-w-md px-4 py-12" data-testid="page-create">
        <p className="text-red-400">Invalid slot. Choose from vessel 1, 2, or 3.</p>
        <Link href="/slots" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200 min-h-[44px] flex items-center">
          {actionLabels.backToSlots}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12" data-testid="page-create">
      <TitleSigil title={screenCopy.createTitle} />
      <p className="mt-2 text-center text-zinc-400">
        {labels.Slot} {vesselOrdinal(slotNum - 1)}
      </p>
      <Frame className="mt-8">
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm text-zinc-400">
              Name
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                maxLength={24}
                required
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-zinc-100 min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => setName(randomName())}
                className={`${buttonGhost()} min-h-[44px]`}
                data-testid="btn-carve-name"
              >
                {actionLabels.carveName}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Species</label>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Species">
              {SPECIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpecies(s)}
                  className={`min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    species === s
                      ? "border-amber-500 bg-amber-900/30 text-amber-200"
                      : `border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 ${card()}`
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full ${buttonPrimary()} min-h-[44px]`}
            data-testid="btn-begin-descent"
          >
            {loading ? "…" : actionLabels.beginDescent}
          </button>
        </form>
      </Frame>
      <Link href="/slots" className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-300 min-h-[44px] flex items-center">
        {actionLabels.backToSlots}
      </Link>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-12 text-zinc-400" data-testid="page-create">
          Loading…
        </div>
      }
    >
      <CreatePageInner />
    </Suspense>
  );
}
