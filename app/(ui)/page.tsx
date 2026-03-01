import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-100">Fate Engine</h1>
      <p className="mt-2 text-zinc-400">Web RPG — Phase 0</p>
      <div className="mt-6 flex gap-4">
        <Link
          href="/login"
          className="rounded bg-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-600"
        >
          Login / Register
        </Link>
      </div>
    </div>
  );
}
