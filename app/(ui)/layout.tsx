import type { Metadata } from "next";
import Link from "next/link";

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold text-zinc-100 hover:text-white">
            Fate Engine
          </Link>
          <Link href="/login" className="text-zinc-400 hover:text-zinc-200">
            Login
          </Link>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
