"use client";

import { useState, useEffect, use, useCallback } from "react";
import { questions } from "@/lib/questions";
import Link from "next/link";

type Guest = {
  id: string;
  name: string;
  photoUrl: string | null;
  answers: Record<string, string>;
  matchedWith: string | null;
  matchNote: string | null;
  createdAt: string;
};

type PartyInfo = {
  id: string;
  name: string;
  code: string;
  matchingDone: boolean;
};

export default function AdminPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);

  const [password, setPassword] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [party, setParty] = useState<PartyInfo | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");
  const [matchSuccess, setMatchSuccess] = useState("");
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchGuests = useCallback(async (pwd: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guests/${code}`, {
        headers: { "x-admin-password": pwd },
      });
      if (!res.ok) throw new Error("Auth failed");
      const data = await res.json();
      setParty(data.party);
      setGuests(data.guests);
    } catch {
      setPassword(""); // Reset auth
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    const stored = sessionStorage.getItem(`admin-${code}`);
    if (stored) {
      setPassword(stored);
      fetchGuests(stored);
    }
  }, [code, fetchGuests]);

  // Auto-refresh guest list every 10 seconds
  useEffect(() => {
    if (!password) return;
    const interval = setInterval(() => fetchGuests(password), 10000);
    return () => clearInterval(interval);
  }, [password, fetchGuests]);

  async function handleAuth() {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, password: inputPassword }),
      });
      const data = await res.json();
      if (!data.valid) {
        setAuthError("Wrong password. Try again!");
        return;
      }
      sessionStorage.setItem(`admin-${code}`, inputPassword);
      setPassword(inputPassword);
      fetchGuests(inputPassword);
    } catch {
      setAuthError("Something went wrong");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleMatch() {
    if (!party) return;
    setMatchLoading(true);
    setMatchError("");
    setMatchSuccess("");
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: party.id, adminPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMatchSuccess(`Matched ${data.matchCount} pair${data.matchCount !== 1 ? "s" : ""}! 🎉`);
      fetchGuests(password);
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "Matching failed");
    } finally {
      setMatchLoading(false);
    }
  }

  async function handleRemoveGuest(guestId: string) {
    if (!confirm("Remove this guest?")) return;
    await fetch(`/api/guest?id=${guestId}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    fetchGuests(password);
  }

  function getMatchedGuest(matchedWith: string | null): Guest | undefined {
    if (!matchedWith) return undefined;
    const ids = matchedWith.split(",");
    return guests.find((g) => ids.includes(g.id));
  }

  function copyJoinLink() {
    navigator.clipboard.writeText(`${window.location.origin}/join`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // --- AUTH SCREEN ---
  if (!password) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm animate-fade-in">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="text-2xl font-bold text-rose-600">Admin Dashboard</h1>
            <p className="text-rose-400 text-sm mt-1">Party code: <strong>{code}</strong></p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 outline-none transition-all text-gray-700 placeholder-gray-300"
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
              autoFocus
            />
            {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
            <button
              onClick={handleAuth}
              disabled={authLoading}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all"
            >
              {authLoading ? "Checking..." : "Enter Dashboard"}
            </button>
          </div>

          <Link href="/" className="block text-center text-rose-300 text-sm mt-4 hover:text-rose-400">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  // --- MAIN DASHBOARD ---
  const matchedGuests = guests.filter((g) => g.matchedWith);
  const unmatchedGuests = guests.filter((g) => !g.matchedWith);

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-rose-600">{party?.name || "Loading..."}</h1>
              <p className="text-rose-400 text-sm">Admin Dashboard</p>
            </div>
            <button
              onClick={() => fetchGuests(password)}
              className="text-rose-400 hover:text-rose-600 text-2xl"
              title="Refresh"
            >
              🔄
            </button>
          </div>

          {/* Party Code */}
          <div className="bg-rose-50 rounded-2xl p-4 mb-4 text-center">
            <p className="text-sm text-rose-400 mb-1">Party Code</p>
            <div className="text-4xl font-bold text-rose-600 tracking-widest">{code}</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-rose-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-rose-600">{guests.length}</div>
              <div className="text-xs text-rose-400">Guests</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-rose-600">{matchedGuests.length}</div>
              <div className="text-xs text-rose-400">Matched</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-rose-600">{unmatchedGuests.length}</div>
              <div className="text-xs text-rose-400">Waiting</div>
            </div>
          </div>

          {/* Copy link */}
          <button
            onClick={copyJoinLink}
            className="w-full bg-rose-100 hover:bg-rose-200 text-rose-600 font-semibold py-2 px-4 rounded-xl mb-3 transition-all text-sm"
          >
            {copied ? "✓ Copied!" : "📋 Copy Join Link for Guests"}
          </button>

          {/* Match button */}
          {matchError && <p className="text-red-500 text-sm text-center mb-2">{matchError}</p>}
          {matchSuccess && <p className="text-green-500 text-sm text-center mb-2">{matchSuccess}</p>}
          <button
            onClick={handleMatch}
            disabled={matchLoading || guests.length < 2}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-95"
          >
            {matchLoading
              ? "AI is thinking... 🤔"
              : party?.matchingDone
              ? "🔁 Re-Match Everyone"
              : "💘 Match Everyone with AI"}
          </button>
          {guests.length < 2 && (
            <p className="text-rose-300 text-xs text-center mt-1">Need at least 2 guests</p>
          )}
        </div>

        {/* Guest List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-rose-600 px-1">
            Guests ({guests.length})
          </h2>

          {loading && <p className="text-rose-400 text-center py-4">Loading...</p>}

          {guests.length === 0 && !loading && (
            <div className="bg-white rounded-2xl shadow p-6 text-center">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-rose-400">Waiting for guests to join...</p>
            </div>
          )}

          {guests.map((guest) => {
            const match = getMatchedGuest(guest.matchedWith);
            return (
              <div key={guest.id} className="bg-white rounded-2xl shadow overflow-hidden">
                {/* Guest header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-rose-50 transition-all"
                  onClick={() =>
                    setExpandedGuest(expandedGuest === guest.id ? null : guest.id)
                  }
                >
                  {guest.photoUrl ? (
                    <img
                      src={guest.photoUrl}
                      alt={guest.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-rose-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-100 text-xl font-bold text-rose-400">
                      {guest.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{guest.name}</p>
                    {match ? (
                      <p className="text-xs text-green-500">Matched with {match.name} 💘</p>
                    ) : (
                      <p className="text-xs text-rose-300">Waiting for match...</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGuest(guest.id);
                      }}
                      className="text-red-300 hover:text-red-500 text-lg p-1"
                      title="Remove guest"
                    >
                      ✕
                    </button>
                    <span className="text-rose-300">{expandedGuest === guest.id ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded answers */}
                {expandedGuest === guest.id && (
                  <div className="border-t border-rose-50 p-4">
                    {match && (
                      <div className="bg-green-50 rounded-xl p-3 mb-3">
                        <p className="text-green-700 font-medium text-sm">
                          Matched with: {match.name}
                        </p>
                        {guest.matchNote && (
                          <p className="text-green-600 text-xs mt-1 italic">"{guest.matchNote}"</p>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      {questions.map((q) => (
                        <div key={q.id}>
                          <p className="text-xs text-rose-400">{q.question}</p>
                          <p className="text-sm text-gray-700">{guest.answers[q.id] || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
