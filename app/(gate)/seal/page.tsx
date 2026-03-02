"use client";

import { useState } from "react";
import Link from "next/link";
import { Frame } from "@/src/ui/components/Frame";
import { TitleSigil } from "@/src/ui/components/TitleSigil";
import { actionLabels, screenCopy } from "@/src/ui/theme/copy";
import { buttonPrimary } from "@/src/ui/theme/classnames";
import { routes } from "@/src/ui/nav/routes";

export default function SealPage() {
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
      const data = (await res.json()) as {
        error?: string | { code?: string; message?: string };
        user?: unknown;
      };
      if (!res.ok) {
        const msg = typeof data.error === "object" ? data.error?.message : data.error;
        setMessage({ type: "err", text: msg ?? "Request failed" });
        return;
      }
      if (isRegister) {
        setMessage({ type: "ok", text: "Registered. You can log in now." });
      } else {
        setMessage({ type: "ok", text: "Logged in." });
        window.location.href = routes.vessels();
      }
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm" data-testid="seal">
      <TitleSigil title={screenCopy.loginTitle} />
      <p className="mt-2 text-center text-sm text-zinc-400">{screenCopy.loginHelper}</p>
      <Frame className="mt-8">
        <form onSubmit={submit} className="space-y-4">
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
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-zinc-100 min-h-[44px]"
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
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-zinc-100 min-h-[44px]"
            />
            {isRegister && (
              <p className="mt-1 text-xs text-zinc-500">At least 8 characters</p>
            )}
          </div>
          {message && (
            <p
              className={
                message.type === "ok" ? "text-sm text-emerald-400" : "text-sm text-red-400"
              }
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full ${buttonPrimary()}`}
            data-testid="btn-sign-in"
          >
            {loading ? "..." : isRegister ? actionLabels.bindAccount : actionLabels.signIn}
          </button>
        </form>
      </Frame>
      <p className="mt-4 text-center text-sm text-zinc-500">
        {isRegister ? "Already have an account?" : "No account yet?"}{" "}
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage(null);
          }}
          className="min-h-[44px] min-w-[44px] text-zinc-300 underline hover:text-zinc-100"
        >
          {isRegister ? actionLabels.signIn : actionLabels.bindAccount}
        </button>
      </p>
      <Link
        href={routes.welcome()}
        className="mt-6 inline-flex min-h-[44px] items-center text-sm text-zinc-500 hover:text-zinc-300"
      >
        {actionLabels.backToHome}
      </Link>
    </div>
  );
}
