import type { Metadata } from "next";
import { AmbientBackground } from "@/src/ui/components/AmbientBackground";

export const metadata: Metadata = {
  title: "Fate Engine",
  description: "Web RPG",
};

export default function GameLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen bg-[#0c0a0b] text-zinc-100 font-ui">
      <AmbientBackground />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
