"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TitleSigil } from "@/src/ui/components/TitleSigil";
import { Frame } from "@/src/ui/components/Frame";
import { labels, actionLabels, screenCopy, vesselOrdinal } from "@/src/ui/theme/copy";
import { card, buttonPrimary, buttonGhost } from "@/src/ui/theme/classnames";

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
  const [pendingDelete, setPendingDelete] = useState<Slot | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/game/slots/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slotIndex: pendingDelete.slotIndex }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        setError(data.error?.message ?? "Failed to delete slot");
        setPendingDelete(null);
        return;
      }
      const data = (await res.json()) as { slots: Slot[] };
      setSlots(data.slots);
      setPendingDelete(null);
    } catch {
      setError("Network error");
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-zinc-400" data-testid="page-slots">
        Loading vessels…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12" data-testid="page-slots">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-zinc-400 hover:text-zinc-200 min-h-[44px] flex items-center">
          {actionLabels.backToHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12" data-testid="page-slots">
      <TitleSigil title={screenCopy.slotsTitle} />
      <p className="mt-2 text-center text-zinc-400">{screenCopy.slots}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {slots?.map((slot) => (
          <div
            key={slot.slotIndex}
            data-testid={`vessel-card-${slot.slotIndex - 1}`}
            className={card()}
          >
            <div className="font-medium text-zinc-200">
              {labels.Slot} {vesselOrdinal(slot.slotIndex - 1)}
            </div>
            {slot.isEmpty ? (
              <>
                <p className="mt-2 text-sm text-zinc-500">Empty</p>
                <Link
                  href={`/create?slotIndex=${slot.slotIndex}`}
                  className={`mt-4 block w-full text-center ${buttonPrimary()} min-h-[44px] flex items-center justify-center`}
                  data-testid="btn-bind"
                >
                  {actionLabels.bind}
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-zinc-300">{slot.character?.name}</p>
                <p className="text-xs text-zinc-500">
                  {slot.character?.species} · {labels.Level} {slot.character?.level}
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/game?slotIndex=${slot.slotIndex}`}
                    className={`flex-1 text-center ${buttonPrimary()} min-h-[44px] flex items-center justify-center`}
                    data-testid="btn-resume-descent"
                  >
                    {actionLabels.resumeDescent}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(slot)}
                    className={`${buttonGhost()} border-red-800 text-red-400 hover:bg-red-900/30 min-h-[44px]`}
                    aria-label={`Delete vessel ${slot.slotIndex}`}
                  >
                    {actionLabels.delete}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <Link href="/" className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-300 min-h-[44px] flex items-center">
        {actionLabels.backToHome}
      </Link>

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-slot-title"
        >
          <Frame className="w-full max-w-sm">
            <h2 id="delete-slot-title" className="text-lg font-semibold text-zinc-100">
              Delete vessel?
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {labels.Slot} {pendingDelete.slotIndex} ({pendingDelete.character?.name}) will be
              permanently deleted. This cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className={`flex-1 ${buttonGhost()} min-h-[44px]`}
              >
                {actionLabels.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className={`flex-1 ${buttonPrimary()} bg-red-600 hover:bg-red-500 min-h-[44px]`}
              >
                {deleting ? "…" : actionLabels.delete}
              </button>
            </div>
          </Frame>
        </div>
      )}
    </div>
  );
}
