import { redirect } from "next/navigation";

export default async function CombatRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const slotIndex = typeof params.slotIndex === "string" ? params.slotIndex : undefined;
  const qs = slotIndex ? `?slotIndex=${slotIndex}` : "";
  redirect(`/shrine/combat${qs}`);
}
