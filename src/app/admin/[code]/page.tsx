"use client";

import { useState, useEffect, use, useCallback } from "react";
import { questions as defaultQuestions, type Question } from "@/lib/questions";
import { themes, defaultSettings, type PartySettings, type ThemeKey } from "@/lib/themes";
import Link from "next/link";

type Guest = {
  id: string;
  name: string;
  gender: string | null;
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
  customQuestions: string | null;
  settings: PartySettings | null;
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
  const [activeTab, setActiveTab] = useState<"guests" | "questions" | "settings">("guests");

  // Manual matching state
  const [pairingMode, setPairingMode] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<string | null>(null);
  const [pairLoading, setPairLoading] = useState(false);

  // Settings state
  const [partySettings, setPartySettings] = useState<PartySettings>(defaultSettings);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Question editor state
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [questionsDirty, setQuestionsDirty] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  type ChatEntry = { role: "user" | "assistant"; content: string; updatedQuestions?: Question[] };
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);

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
      if (data.party.customQuestions) {
        setQuestions(JSON.parse(data.party.customQuestions));
      }
      if (data.party.settings) {
        setPartySettings({ ...defaultSettings, ...data.party.settings });
      }
    } catch {
      setPassword("");
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
      if (!data.valid) { setAuthError("Wrong password. Try again!"); return; }
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
      setMatchSuccess(`Sparks flew for ${data.matchCount} pair${data.matchCount !== 1 ? "s" : ""}! 🔥`);
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

  // Question editor functions
  function updateQuestion(idx: number, updated: Partial<Question>) {
    setQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, ...updated } as Question : q));
    setQuestionsDirty(true);
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx || q.type !== "choice") return q;
      const newOptions = [...(q.options || [])];
      newOptions[optIdx] = value;
      return { ...q, options: newOptions };
    }));
    setQuestionsDirty(true);
  }

  function addOption(qIdx: number) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx || q.type !== "choice") return q;
      return { ...q, options: [...(q.options || []), "New option"] };
    }));
    setQuestionsDirty(true);
  }

  function removeOption(qIdx: number, optIdx: number) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx || q.type !== "choice") return q;
      return { ...q, options: (q.options || []).filter((_, oi) => oi !== optIdx) };
    }));
    setQuestionsDirty(true);
  }

  function addQuestion() {
    const newQ: Question = {
      id: `custom_${Date.now()}`,
      question: "New question?",
      type: "choice",
      options: ["Option 1", "Option 2", "Option 3"],
    };
    setQuestions((prev) => [...prev, newQ]);
    setQuestionsDirty(true);
    setEditingQuestion(newQ.id);
  }

  function removeQuestion(idx: number) {
    if (!confirm("Remove this question?")) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setQuestionsDirty(true);
  }

  function convertType(idx: number) {
    setQuestions((prev) => prev.map((q, i) => {
      if (i !== idx) return q;
      if (q.type === "choice") {
        return { id: q.id, question: q.question, type: "text" as const, placeholder: "Type your answer..." };
      } else {
        return { id: q.id, question: q.question, type: "choice" as const, options: ["Option 1", "Option 2", "Option 3"] };
      }
    }));
    setQuestionsDirty(true);
  }

  async function saveQuestions() {
    if (!party) return;
    setSavingQuestions(true);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: party.id, adminPassword: password, questions }),
      });
      if (res.ok) setQuestionsDirty(false);
    } finally {
      setSavingQuestions(false);
    }
  }

  async function resetQuestions() {
    if (!party || !confirm("Reset to default questions?")) return;
    await fetch("/api/admin/questions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId: party.id, adminPassword: password }),
    });
    setQuestions(defaultQuestions);
    setQuestionsDirty(false);
  }

  async function sendAIMessage() {
    if (!party || !chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    const newUserEntry: ChatEntry = { role: "user", content: userMessage };
    setChatHistory((prev) => [...prev, newUserEntry]);
    setAiLoading(true);
    try {
      // Build history for API (only role+content, no updatedQuestions)
      const apiHistory = [...chatHistory, newUserEntry].map(({ role, content }) => ({ role, content }));
      const res = await fetch("/api/admin/questions/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: party.id,
          adminPassword: password,
          currentQuestions: questions,
          history: apiHistory,
        }),
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error — try again");
      }
      if (!res.ok) throw new Error(data.error);
      const assistantEntry: ChatEntry = {
        role: "assistant",
        content: data.suggestion,
        updatedQuestions: data.updatedQuestions,
      };
      setChatHistory((prev) => [...prev, assistantEntry]);
    } catch (e) {
      setChatHistory((prev) => [...prev, { role: "assistant", content: "Error: " + (e instanceof Error ? e.message : "AI request failed") }]);
    } finally {
      setAiLoading(false);
    }
  }

  function acceptAISuggestion(updatedQuestions: Question[]) {
    setQuestions(updatedQuestions);
    setQuestionsDirty(true);
    // Mark the entry as accepted (clear updatedQuestions so button disappears)
    setChatHistory((prev) => prev.map((entry) =>
      entry.updatedQuestions === updatedQuestions ? { ...entry, updatedQuestions: undefined } : entry
    ));
  }

  async function handlePairGuest(clickedId: string) {
    if (!party) return;
    if (!selectedGuest) {
      setSelectedGuest(clickedId);
      return;
    }
    if (selectedGuest === clickedId) {
      setSelectedGuest(null);
      return;
    }
    setPairLoading(true);
    try {
      await fetch("/api/admin/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: party.id, adminPassword: password, action: "pair", guest1Id: selectedGuest, guest2Id: clickedId }),
      });
      setSelectedGuest(null);
      fetchGuests(password);
    } finally {
      setPairLoading(false);
    }
  }

  async function handleUnpair(guestId: string) {
    if (!party || !confirm("Unmatch this guest?")) return;
    await fetch("/api/admin/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId: party.id, adminPassword: password, action: "unpair", guestId }),
    });
    fetchGuests(password);
  }

  async function handleFinalize() {
    if (!party || !confirm("Reveal all matches to guests? They'll see their match on their phones.")) return;
    await fetch("/api/admin/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partyId: party.id, adminPassword: password, action: "finalize" }),
    });
    fetchGuests(password);
  }

  async function saveSettings() {
    if (!party) return;
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: party.id, adminPassword: password, settings: partySettings }),
      });
      if (res.ok) setSettingsDirty(false);
    } finally {
      setSavingSettings(false);
    }
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

  function genderEmoji(gender: string | null) {
    if (gender === "male") return "👨";
    if (gender === "female") return "👩";
    if (gender === "other") return "🌈";
    return "❓";
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
            <button onClick={handleAuth} disabled={authLoading} className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all">
              {authLoading ? "Checking..." : "Enter Dashboard"}
            </button>
          </div>
          <Link href="/" className="block text-center text-rose-300 text-sm mt-4 hover:text-rose-400">← Back to home</Link>
        </div>
      </main>
    );
  }

  const matchedGuests = guests.filter((g) => g.matchedWith);
  const maleCount = guests.filter((g) => g.gender === "male").length;
  const femaleCount = guests.filter((g) => g.gender === "female").length;

  // --- MAIN DASHBOARD ---
  return (
    <main className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-rose-600">{party?.name || "Loading..."}</h1>
              <p className="text-rose-400 text-sm">Admin Dashboard 🔥</p>
            </div>
            <button onClick={() => fetchGuests(password)} className="text-rose-400 hover:text-rose-600 text-2xl" title="Refresh">🔄</button>
          </div>

          {/* Party Code */}
          <div className="bg-rose-50 rounded-2xl p-4 mb-4 text-center">
            <p className="text-sm text-rose-400 mb-1">Party Code</p>
            <div className="text-4xl font-bold text-rose-600 tracking-widest">{code}</div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-rose-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-rose-600">{guests.length}</div>
              <div className="text-xs text-rose-400">Total</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-blue-500">{maleCount}</div>
              <div className="text-xs text-blue-400">👨 Males</div>
            </div>
            <div className="bg-pink-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-pink-500">{femaleCount}</div>
              <div className="text-xs text-pink-400">👩 Females</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-500">{matchedGuests.length}</div>
              <div className="text-xs text-green-400">🔥 Sparked</div>
            </div>
          </div>

          <button onClick={copyJoinLink} className="w-full bg-rose-100 hover:bg-rose-200 text-rose-600 font-semibold py-2 px-4 rounded-xl mb-3 transition-all text-sm">
            {copied ? "✓ Copied!" : "📋 Copy Join Link for Guests"}
          </button>

          {matchError && <p className="text-red-500 text-sm text-center mb-2">{matchError}</p>}
          {matchSuccess && <p className="text-green-500 text-sm text-center mb-2">{matchSuccess}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleMatch}
              disabled={matchLoading || guests.length < 2}
              className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-base transition-all active:scale-95"
            >
              {matchLoading ? "Matching... 🤔" : party?.matchingDone ? "🔁 Re-run AI" : "✨ AI Match"}
            </button>
            <button
              onClick={() => { setPairingMode((v) => !v); setSelectedGuest(null); setActiveTab("guests"); }}
              className={`flex-1 font-bold py-4 rounded-xl text-base transition-all active:scale-95 ${pairingMode ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-white border-2 border-rose-200 text-rose-500 hover:bg-rose-50"}`}
            >
              {pairingMode ? "✓ Done Pairing" : "🎯 Manual Match"}
            </button>
          </div>
          {guests.length < 2 && <p className="text-rose-300 text-xs text-center mt-1">Need at least 2 guests</p>}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("guests")}
            className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === "guests" ? "bg-rose-500 text-white" : "bg-white text-rose-400 hover:bg-rose-50"}`}
          >
            Guests ({guests.length})
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === "questions" ? "bg-rose-500 text-white" : "bg-white text-rose-400 hover:bg-rose-50"}`}
          >
            Questions {questionsDirty ? "●" : ""}
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${activeTab === "settings" ? "bg-rose-500 text-white" : "bg-white text-rose-400 hover:bg-rose-50"}`}
          >
            Settings {settingsDirty ? "●" : ""}
          </button>
        </div>

        {/* GUESTS TAB */}
        {activeTab === "guests" && (
          <div className="space-y-3">
            {/* Manual pairing instructions */}
            {pairingMode && (
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4">
                {selectedGuest ? (
                  <p className="text-purple-700 font-bold text-sm text-center">
                    ✓ {guests.find((g) => g.id === selectedGuest)?.name} selected — now tap someone to pair them
                  </p>
                ) : (
                  <p className="text-purple-600 font-semibold text-sm text-center">
                    Tap any guest to select them, then tap another to pair them together
                  </p>
                )}
                {pairLoading && <p className="text-purple-400 text-xs text-center mt-1">Pairing...</p>}
                {/* Finalize button */}
                {guests.some((g) => g.matchedWith) && !party?.matchingDone && (
                  <button
                    onClick={handleFinalize}
                    className="w-full mt-3 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    🎉 Reveal All Matches to Guests
                  </button>
                )}
              </div>
            )}

            {loading && <p className="text-rose-400 text-center py-4">Loading...</p>}
            {guests.length === 0 && !loading && (
              <div className="bg-white rounded-2xl shadow p-6 text-center">
                <div className="text-4xl mb-2">⏳</div>
                <p className="text-rose-400">Waiting for guests to join...</p>
              </div>
            )}
            {guests.map((guest) => {
              const match = getMatchedGuest(guest.matchedWith);
              const isSelected = selectedGuest === guest.id;
              const isMatched = !!guest.matchedWith;

              if (pairingMode) {
                return (
                  <div
                    key={guest.id}
                    onClick={() => !isMatched && handlePairGuest(guest.id)}
                    className={`bg-white rounded-2xl shadow p-4 flex items-center gap-3 transition-all ${
                      isMatched
                        ? "opacity-60"
                        : isSelected
                        ? "ring-2 ring-purple-500 bg-purple-50 cursor-pointer"
                        : "cursor-pointer hover:bg-purple-50 active:scale-95"
                    }`}
                  >
                    {guest.photoUrl ? (
                      <img src={guest.photoUrl} alt={guest.name} className="w-12 h-12 rounded-full object-cover border-2 border-rose-100 flex-shrink-0" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${isSelected ? "bg-purple-200 text-purple-700" : "bg-rose-100 text-rose-400"}`}>
                        {guest.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{genderEmoji(guest.gender)} {guest.name}</p>
                      {match ? (
                        <p className="text-xs text-green-500 font-semibold">✓ Paired with {match.name}</p>
                      ) : isSelected ? (
                        <p className="text-xs text-purple-500 font-semibold">Selected — tap partner</p>
                      ) : (
                        <p className="text-xs text-gray-400">Tap to select</p>
                      )}
                    </div>
                    {isMatched && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUnpair(guest.id); }}
                        className="text-xs text-red-400 hover:text-red-600 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
                      >
                        Unpair
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div key={guest.id} className="bg-white rounded-2xl shadow overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-rose-50 transition-all"
                    onClick={() => setExpandedGuest(expandedGuest === guest.id ? null : guest.id)}
                  >
                    {guest.photoUrl ? (
                      <img src={guest.photoUrl} alt={guest.name} className="w-12 h-12 rounded-full object-cover border-2 border-rose-100" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-100 text-xl font-bold text-rose-400">
                        {guest.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">
                        {genderEmoji(guest.gender)} {guest.name}
                      </p>
                      {match ? (
                        <p className="text-xs text-rose-500">🔥 Sparked with {match.name}</p>
                      ) : (
                        <p className="text-xs text-rose-300">Waiting for their flame...</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveGuest(guest.id); }} className="text-red-300 hover:text-red-500 text-lg p-1" title="Remove">✕</button>
                      <span className="text-rose-300">{expandedGuest === guest.id ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {expandedGuest === guest.id && (
                    <div className="border-t border-rose-50 p-4">
                      {match && (
                        <div className="bg-rose-50 rounded-xl p-3 mb-3">
                          <p className="text-rose-700 font-medium text-sm">🔥 Sparked with: {match.name}</p>
                          {guest.matchNote && <p className="text-rose-500 text-xs mt-1 italic">&quot;{guest.matchNote}&quot;</p>}
                        </div>
                      )}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-rose-400 uppercase tracking-wide">Gender: {guest.gender || "not specified"}</p>
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
        )}

        {/* QUESTIONS TAB */}
        {activeTab === "questions" && (
          <div className="space-y-4">
            {/* AI Chat */}
            <div className="bg-white rounded-2xl shadow p-4">
              <h3 className="font-bold text-rose-600 mb-1">🤖 AI Question Assistant</h3>
              <p className="text-xs text-rose-400 mb-3">Chat with AI to brainstorm and customize your questions. Say things like &quot;make them spicier&quot;, &quot;add a question about travel&quot;, or &quot;what would work well for a 21st birthday?&quot;</p>

              {/* Chat history */}
              {chatHistory.length > 0 && (
                <div className="space-y-3 mb-3 max-h-80 overflow-y-auto">
                  {chatHistory.map((entry, i) => (
                    <div key={i} className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${entry.role === "user" ? "bg-rose-500 text-white rounded-br-sm" : "bg-rose-50 text-rose-800 rounded-bl-sm"}`}>
                        <p>{entry.content}</p>
                        {entry.updatedQuestions && (
                          <div className="mt-2 pt-2 border-t border-rose-200 flex gap-2">
                            <button
                              onClick={() => acceptAISuggestion(entry.updatedQuestions!)}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-lg transition-all"
                            >
                              ✓ Apply Changes
                            </button>
                            <button
                              onClick={() => setChatHistory((prev) => prev.map((e, j) => j === i ? { ...e, updatedQuestions: undefined } : e))}
                              className="bg-white hover:bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1 rounded-lg transition-all"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-rose-50 text-rose-400 text-sm rounded-2xl rounded-bl-sm px-4 py-3">
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={chatHistory.length === 0 ? "Ask AI about your questions..." : "Reply..."}
                  className="flex-1 border-2 border-rose-100 focus:border-rose-400 rounded-xl px-3 py-2 outline-none text-sm text-gray-700 placeholder-gray-300"
                  onKeyDown={(e) => e.key === "Enter" && sendAIMessage()}
                  disabled={aiLoading}
                />
                <button
                  onClick={sendAIMessage}
                  disabled={aiLoading || !chatInput.trim()}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition-all text-sm"
                >
                  {aiLoading ? "..." : "Send"}
                </button>
              </div>
              {chatHistory.length > 0 && (
                <button onClick={() => setChatHistory([])} className="text-xs text-rose-300 hover:text-rose-400 mt-2 w-full text-center">
                  Clear conversation
                </button>
              )}
            </div>

            {/* Save / Reset bar */}
            <div className="flex gap-2">
              <button
                onClick={saveQuestions}
                disabled={!questionsDirty || savingQuestions}
                className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all text-sm"
              >
                {savingQuestions ? "Saving..." : questionsDirty ? "💾 Save Questions" : "✓ Saved"}
              </button>
              <button onClick={resetQuestions} className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-semibold py-3 px-4 rounded-xl transition-all text-sm">
                Reset to defaults
              </button>
            </div>

            {/* Question list */}
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white rounded-2xl shadow overflow-hidden">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-rose-50"
                    onClick={() => setEditingQuestion(editingQuestion === q.id ? null : q.id)}
                  >
                    <span className="text-rose-300 font-bold text-sm w-6">{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{q.question}</p>
                      <p className="text-xs text-rose-300">{q.type === "choice" ? `${q.options?.length} options` : "Text answer"}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); convertType(idx); }}
                        className="text-xs bg-rose-100 hover:bg-rose-200 text-rose-500 px-2 py-1 rounded-lg"
                        title="Toggle type"
                      >
                        {q.type === "choice" ? "→ Text" : "→ Choice"}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="text-red-300 hover:text-red-500">✕</button>
                      <span className="text-rose-300 text-sm">{editingQuestion === q.id ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {editingQuestion === q.id && (
                    <div className="border-t border-rose-50 p-4 space-y-3">
                      <div>
                        <label className="text-xs text-rose-400 font-medium">Question text</label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => updateQuestion(idx, { question: e.target.value })}
                          className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-3 py-2 outline-none text-sm text-gray-700 mt-1"
                        />
                      </div>

                      {q.type === "choice" && (
                        <div>
                          <label className="text-xs text-rose-400 font-medium">Options</label>
                          <div className="space-y-2 mt-1">
                            {(q.options || []).map((opt, oi) => (
                              <div key={oi} className="flex gap-2">
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateOption(idx, oi, e.target.value)}
                                  className="flex-1 border-2 border-rose-100 focus:border-rose-400 rounded-lg px-3 py-2 outline-none text-sm text-gray-700"
                                />
                                <button onClick={() => removeOption(idx, oi)} className="text-red-300 hover:text-red-500 px-2">✕</button>
                              </div>
                            ))}
                            {(q.options?.length ?? 0) < 5 && (
                              <button onClick={() => addOption(idx)} className="text-xs text-rose-400 hover:text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">
                                + Add option
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {q.type === "text" && (
                        <div>
                          <label className="text-xs text-rose-400 font-medium">Placeholder text</label>
                          <input
                            type="text"
                            value={q.placeholder || ""}
                            onChange={(e) => updateQuestion(idx, { placeholder: e.target.value })}
                            className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-3 py-2 outline-none text-sm text-gray-700 mt-1"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={addQuestion}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-500 font-bold py-3 rounded-xl border-2 border-dashed border-rose-200 transition-all"
            >
              + Add Question
            </button>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow p-5 space-y-4">
              <h3 className="font-bold text-rose-600 text-lg">Party Branding</h3>

              <div>
                <label className="block text-sm font-semibold text-rose-600 mb-1">App Name</label>
                <input
                  type="text"
                  value={partySettings.appName}
                  onChange={(e) => { setPartySettings((s) => ({ ...s, appName: e.target.value })); setSettingsDirty(true); }}
                  placeholder="Party Match"
                  className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 outline-none text-gray-700 placeholder-gray-300"
                />
                <p className="text-xs text-rose-300 mt-1">Shown to guests at the top of their questionnaire</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-rose-600 mb-1">Tagline</label>
                <input
                  type="text"
                  value={partySettings.tagline}
                  onChange={(e) => { setPartySettings((s) => ({ ...s, tagline: e.target.value })); setSettingsDirty(true); }}
                  placeholder="Find your perfect match tonight!"
                  className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 outline-none text-gray-700 placeholder-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-rose-600 mb-1">Match Label</label>
                <input
                  type="text"
                  value={partySettings.matchLabel}
                  onChange={(e) => { setPartySettings((s) => ({ ...s, matchLabel: e.target.value })); setSettingsDirty(true); }}
                  placeholder="Secret Flame"
                  className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 outline-none text-gray-700 placeholder-gray-300"
                />
                <p className="text-xs text-rose-300 mt-1">What you call the match reveal — e.g. &quot;Secret Flame&quot;, &quot;Secret Target&quot;, &quot;Mystery Buddy&quot;</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow p-5">
              <h3 className="font-bold text-rose-600 text-lg mb-3">Color Theme</h3>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(themes) as [ThemeKey, typeof themes[ThemeKey]][]).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => { setPartySettings((s) => ({ ...s, theme: key })); setSettingsDirty(true); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                    style={
                      partySettings.theme === key
                        ? { borderColor: t.primary, backgroundColor: t.light }
                        : { borderColor: "#f1f5f9" }
                    }
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: t.primary }}>
                      {t.emoji}
                    </div>
                    <span className="text-xs font-bold text-gray-600">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={saveSettings}
              disabled={!settingsDirty || savingSettings}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition-all"
            >
              {savingSettings ? "Saving..." : settingsDirty ? "Save Settings" : "Settings Saved ✓"}
            </button>

            <p className="text-xs text-rose-300 text-center">
              Settings apply to new guests joining — tell existing guests to refresh if needed
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
