"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleJoin() {
    if (code.trim().length < 6) {
      setError("Enter a 6-character party code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Store party info in localStorage
      localStorage.setItem("partyId", data.id);
      localStorage.setItem("partyName", data.name);

      router.push(`/party/${data.code}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold text-rose-600">Join a Party</h1>
          <p className="text-rose-400 text-sm mt-1">Enter the code from your host</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="XKCD42"
            maxLength={6}
            className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-4 py-4 outline-none transition-all text-gray-700 text-center text-3xl font-bold tracking-widest placeholder-gray-200 uppercase"
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            onClick={handleJoin}
            disabled={loading || code.length < 6}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-95"
          >
            {loading ? "Joining..." : "Let's Go! 🚀"}
          </button>
        </div>

        <Link href="/" className="block text-center text-rose-300 text-sm mt-4 hover:text-rose-400">
          ← Back
        </Link>
      </div>
    </main>
  );
}
