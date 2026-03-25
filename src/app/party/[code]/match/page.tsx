"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";

type MatchData = {
  matched: true;
  matches: { id: string; name: string; photoUrl: string | null }[];
  matchNote: string;
} | { matched: false };

export default function MatchPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  use(params);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [guestName, setGuestName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("guestName") || "You";
    setGuestName(name);

    const guestId = localStorage.getItem("guestId");
    if (!guestId) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    async function checkMatch() {
      try {
        const res = await fetch(`/api/match/${guestId}`);
        const data = await res.json();

        if (data.matched) {
          setMatchData(data as MatchData);
          setTimeout(() => {
            setShowReveal(true);
            import("canvas-confetti").then(({ default: confetti }) => {
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#f43f5e", "#fb7185", "#fda4af", "#ff69b4", "#ff4500", "#fff"] });
            });
          }, 300);
        } else {
          timeoutId = setTimeout(checkMatch, 5000);
        }
      } catch {
        timeoutId = setTimeout(checkMatch, 5000);
      }
    }

    checkMatch();
    return () => clearTimeout(timeoutId);
  }, []);

  if (!matchData || !matchData.matched) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <div className="text-7xl mb-6 animate-bounce-soft">🔥</div>
          <h1 className="text-2xl font-bold text-rose-600 mb-2">You&apos;re in!</h1>
          <p className="text-rose-400 text-lg mb-2">Hey {guestName}! 👋</p>
          <p className="text-rose-400">The sparks are still flying...</p>
          <p className="text-rose-300 text-sm mt-2">Keep this page open — your Secret Flame will appear here!</p>
          <div className="mt-8 flex gap-2 justify-center">
            <div className="w-3 h-3 bg-rose-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </main>
    );
  }

  const matchedPeople = matchData.matches;
  const isTrio = matchedPeople.length > 1;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {showReveal && (
        <div className="text-center animate-pop">
          <div className="text-5xl mb-2">🔥</div>
          <h1 className="text-3xl font-bold text-rose-600 mb-1">
            {isTrio ? "Your Secret Flames are..." : "Your Secret Flame is..."}
          </h1>
          <p className="text-rose-400 mb-6">Hey {guestName}!</p>

          {matchedPeople.map((person) => (
            <div key={person.id} className="bg-white rounded-3xl shadow-xl p-6 mb-4 w-full max-w-xs mx-auto">
              {person.photoUrl ? (
                <img
                  src={person.photoUrl}
                  alt={person.name}
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-3 border-4 border-rose-200"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3 border-4 border-rose-200">
                  <span className="text-5xl">{person.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-800">{person.name}</h2>
            </div>
          ))}

          {matchData.matchNote && (
            <div className="bg-rose-50 rounded-2xl p-4 mt-2 max-w-xs mx-auto">
              <p className="text-rose-600 text-sm italic">✨ {matchData.matchNote}</p>
            </div>
          )}

          <p className="text-rose-400 mt-6 text-lg font-medium animate-bounce-soft">
            Go find your flame! 🔥
          </p>

          <Link href="/" className="block mt-6 text-rose-300 text-sm hover:text-rose-400">
            Back to home
          </Link>
        </div>
      )}

      {!showReveal && matchData.matched && (
        <div className="text-center">
          <div className="text-6xl animate-bounce-soft">🔥</div>
          <p className="text-rose-400 mt-4">Drumroll please...</p>
        </div>
      )}
    </main>
  );
}
