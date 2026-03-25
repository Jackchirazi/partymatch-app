"use client";

import { useState } from "react";
import Link from "next/link";

export default function HostPage() {
  const [partyName, setPartyName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    if (!partyName.trim() || !password.trim()) {
      setError("Fill in both fields!");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/party", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: partyName.trim(), adminPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ code: data.code, name: data.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const joinUrl = result ? `${window.location.origin}/join` : "";

  async function copyLink() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm text-center animate-pop">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-rose-600 mb-1">Party Created!</h1>
          <p className="text-rose-400 mb-6">{result.name}</p>

          <div className="bg-rose-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-rose-400 mb-2">Your party code</p>
            <div className="text-5xl font-bold text-rose-600 tracking-widest">{result.code}</div>
            <p className="text-xs text-rose-300 mt-2">Tell everyone to enter this code!</p>
          </div>

          <button
            onClick={copyLink}
            className="w-full bg-rose-100 hover:bg-rose-200 text-rose-600 font-semibold py-3 px-6 rounded-xl mb-4 transition-all"
          >
            {copied ? "✓ Copied!" : "📋 Copy Join Link"}
          </button>

          <Link
            href={`/admin/${result.code}`}
            className="block w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
          >
            🖥️ Open Admin Dashboard
          </Link>

          <p className="text-xs text-rose-300 mt-4">
            Save your password: you&apos;ll need it on the admin page
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎂</div>
          <h1 className="text-2xl font-bold text-rose-600">Host a Party</h1>
          <p className="text-rose-400 text-sm mt-1">Set up your matchmaking event</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-rose-600 mb-1">
              Party Name
            </label>
            <input
              type="text"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
              placeholder="e.g. Sarah's 25th Birthday 🎉"
              className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 outline-none transition-all text-gray-700 placeholder-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-rose-600 mb-1">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Only you need to know this"
              className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 outline-none transition-all text-gray-700 placeholder-gray-300"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-95"
          >
            {loading ? "Creating..." : "Create Party ✨"}
          </button>
        </div>

        <Link href="/" className="block text-center text-rose-300 text-sm mt-4 hover:text-rose-400">
          ← Back
        </Link>
      </div>
    </main>
  );
}
