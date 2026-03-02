import type { Metadata } from "next";
import Link from "next/link";
import { AmbientBackground } from "@/src/ui/components/AmbientBackground";
import { labels } from "@/src/ui/theme/copy";
import { typography } from "@/src/ui/theme/tokens";

export const metadata: Metadata = {
  title: "Fate Engine",
  description: "Web RPG",
};

export default function UiLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-[#0c0a0b] text-zinc-100 font-ui">
      <AmbientBackground />
      <nav className="relative z-10 border-b border-zinc-700/80 px-4 py-3 bg-zinc-900/80">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={`${typography.fontTitle} font-semibold text-zinc-100 hover:text-amber-500/90`}
          >
            Fate Engine
          </Link>
          <Link href="/slots" className="text-zinc-400 hover:text-zinc-200 min-h-[44px] min-w-[44px] inline-flex items-center">
            {labels.Slot}s
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-zinc-200 min-h-[44px] min-w-[44px] inline-flex items-center">
            Login
          </Link>
        </div>
      </nav>
      <main className="relative z-10">{children}</main>
    </div>
  );
}
