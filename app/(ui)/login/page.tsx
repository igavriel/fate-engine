"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const url = isRegister ? "/api/auth/register" : "/api/auth/login";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string; user?: unknown };
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Request failed" });
        return;
      }
      if (isRegister) {
        setMessage({ type: "ok", text: "Registered. You can log in now." });
      } else {
        setMessage({ type: "ok", text: "Logged in." });
        window.location.href = "/";
      }
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-xl font-semibold text-zinc-100">{isRegister ? "Register" : "Login"}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-zinc-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-zinc-400">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isRegister ? 8 : undefined}
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
          />
          {isRegister && <p className="mt-1 text-xs text-zinc-500">At least 8 characters</p>}
        </div>
        {message && (
          <p className={message.type === "ok" ? "text-sm text-green-400" : "text-sm text-red-400"}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-zinc-700 py-2 font-medium text-zinc-100 hover:bg-zinc-600 disabled:opacity-50"
        >
          {loading ? "..." : isRegister ? "Register" : "Login"}
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-500">
        {isRegister ? "Already have an account?" : "No account yet?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage(null);
          }}
          className="text-zinc-300 underline hover:text-zinc-100"
        >
          {isRegister ? "Login" : "Register"}
        </button>
      </p>
      <Link href="/" className="mt-6 inline-block text-sm text-zinc-500 hover:text-zinc-300">
        ← Back to home
      </Link>
    </div>
  );
}
