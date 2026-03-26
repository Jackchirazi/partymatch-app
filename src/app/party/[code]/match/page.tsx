"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { defaultSettings, getTheme, type PartySettings } from "@/lib/themes";

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
  const { code } = use(params);
  const router = useRouter();
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [settings, setSettings] = useState<PartySettings>(defaultSettings);

  useEffect(() => {
    const name = localStorage.getItem("guestName") || "You";
    setGuestName(name);

    const stored = localStorage.getItem("partySettings");
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {}
    }

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
              confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ["#f43f5e", "#a855f7", "#3b82f6", "#fbbf24", "#34d399", "#fff"] });
              setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { y: 0.3 }, angle: 60 }), 500);
              setTimeout(() => confetti({ particleCount: 100, spread: 60, origin: { y: 0.3 }, angle: 120 }), 500);
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

  const theme = getTheme(settings.theme);
  const { matchLabel, blindMode } = settings;

  if (!matchData || !matchData.matched) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center animate-fade-in">
          <div className="text-7xl mb-6 animate-float">🎉</div>
          <h1 className="text-2xl font-black mb-2" style={{ color: theme.text }}>You&apos;re in, {guestName}!</h1>
          <p className="text-gray-500 text-lg mb-2">Waiting for the host to reveal matches...</p>
          <p className="text-gray-400 text-sm">Your {matchLabel} will appear here</p>
          <div className="mt-8 flex gap-2 justify-center">
            <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: theme.textLight, animationDelay: "0ms" }} />
            <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: "150ms" }} />
            <div className="w-3 h-3 rounded-full animate-bounce" style={{ backgroundColor: theme.text, animationDelay: "300ms" }} />
          </div>
        </div>
      </main>
    );
  }

  const matchedPeople = matchData.matches;
  const isTrio = matchedPeople.length > 1;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      {showReveal && blindMode && (
        <div className="text-center animate-pop">
          <div className="text-5xl mb-2 animate-float">🕵️</div>
          <h1 className="text-3xl font-black mb-1" style={{ color: theme.text }}>
            You&apos;ve been matched!
          </h1>
          <p className="text-gray-400 mb-6">Hey {guestName} — your {matchLabel} is a mystery...</p>

          <div className="bg-white rounded-3xl shadow-xl p-6 mb-4 w-full max-w-xs mx-auto">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-3 border-4 animate-pulse"
              style={{ backgroundColor: theme.lighter, borderColor: theme.border }}
            >
              <span className="text-5xl">❓</span>
            </div>
            <h2 className="text-2xl font-black text-gray-400">???</h2>
            <p className="text-sm text-gray-300 mt-1">Find out through chat</p>
          </div>

          <button
            onClick={() => router.push(`/party/${code}/chat`)}
            className="mt-4 w-full max-w-xs mx-auto block text-white font-black py-4 rounded-xl text-lg transition-all active:scale-95"
            style={{ backgroundColor: theme.primary }}
          >
            💬 Start chatting →
          </button>

          <Link href="/" className="block mt-4 text-gray-300 text-sm hover:text-gray-400">
            Back to home
          </Link>
        </div>
      )}

      {showReveal && !blindMode && (
        <div className="text-center animate-pop">
          <div className="text-5xl mb-2 animate-float">🔥</div>
          <h1 className="text-3xl font-black mb-1" style={{ color: theme.text }}>
            {isTrio ? `Your ${matchLabel}s are...` : `Your ${matchLabel} is...`}
          </h1>
          <p className="text-gray-400 mb-6">Hey {guestName}!</p>

          {matchedPeople.map((person) => (
            <div key={person.id} className="bg-white rounded-3xl shadow-xl p-6 mb-4 w-full max-w-xs mx-auto">
              {person.photoUrl ? (
                <img
                  src={person.photoUrl}
                  alt={person.name}
                  className="w-28 h-28 rounded-full object-cover mx-auto mb-3 border-4"
                  style={{ borderColor: theme.border }}
                />
              ) : (
                <div
                  className="w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-3 border-4"
                  style={{ backgroundColor: theme.lighter, borderColor: theme.border }}
                >
                  <span className="text-5xl font-black" style={{ color: theme.text }}>{person.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <h2 className="text-2xl font-black text-gray-800">{person.name}</h2>
            </div>
          ))}

          {matchData.matchNote && (
            <div className="rounded-2xl p-4 mt-2 max-w-xs mx-auto" style={{ backgroundColor: theme.light }}>
              <p className="text-sm italic" style={{ color: theme.text }}>✨ {matchData.matchNote}</p>
            </div>
          )}

          <p className="mt-6 text-xl font-black animate-bounce-soft" style={{ color: theme.primary }}>
            Go find them! 🔥
          </p>

          <button
            onClick={() => router.push(`/party/${code}/chat`)}
            className="mt-4 w-full max-w-xs mx-auto block text-white font-black py-4 rounded-xl text-lg transition-all active:scale-95"
            style={{ backgroundColor: theme.primary }}
          >
            💬 Message your {matchLabel}
          </button>

          <Link href="/" className="block mt-4 text-gray-300 text-sm hover:text-gray-400">
            Back to home
          </Link>
        </div>
      )}

      {!showReveal && matchData.matched && (
        <div className="text-center">
          <div className="text-6xl animate-bounce-soft">🎊</div>
          <p className="text-gray-400 mt-4 font-semibold">Drumroll please...</p>
        </div>
      )}
    </main>
  );
}
