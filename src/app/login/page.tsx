"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!code.trim() || !name.trim() || pin.length !== 4) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), name: name.trim(), pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("guestId", data.guestId);
      localStorage.setItem("guestName", data.guestName);
      localStorage.setItem("partyId", data.partyId);
      localStorage.setItem("partyName", data.partyName);
      if (data.settings) {
        localStorage.setItem("partySettings", JSON.stringify(data.settings));
      }

      router.push(`/party/${data.partyCode}/match`);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-float">🔑</div>
          <h1 className="text-2xl font-black text-gray-800">Log back in</h1>
          <p className="text-gray-400 text-sm mt-1">Enter your party code, name, and PIN</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Party Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="e.g. ABC123"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-rose-300 outline-none text-base font-mono tracking-widest uppercase"
              maxLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Same name you used when joining"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-rose-300 outline-none text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">Your PIN</label>
            <input
              type="text"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="4-digit PIN"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-rose-300 outline-none text-base tracking-widest font-mono"
              maxLength={4}
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center font-semibold">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || !code.trim() || !name.trim() || pin.length !== 4}
          className="w-full text-white font-black py-4 rounded-xl text-lg transition-all active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: "#f43f5e" }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <button
          onClick={() => router.push("/")}
          className="block w-full text-center text-gray-300 text-sm mt-3 hover:text-gray-400"
        >
          ← Back to home
        </button>
      </div>
    </main>
  );
}
