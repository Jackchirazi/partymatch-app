"use client";

import { useState, useEffect, use, useCallback } from "react";
import { questions as defaultQuestions, type Question } from "@/lib/questions";
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
  const [activeTab, setActiveTab] = useState<"guests" | "questions">("guests");

  // Question editor state
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [questionsDirty, setQuestionsDirty] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ suggestion: string; updatedQuestions?: Question[] } | null>(null);

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

  async function askAI() {
    if (!party || !aiMessage.trim()) return;
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await fetch("/api/admin/questions/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partyId: party.id,
          adminPassword: password,
          currentQuestions: questions,
          message: aiMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiSuggestion(data);
    } catch (e) {
      setAiSuggestion({ suggestion: "Error: " + (e instanceof Error ? e.message : "AI request failed") });
    } finally {
      setAiLoading(false);
    }
  }

  function acceptAISuggestion() {
    if (!aiSuggestion?.updatedQuestions) return;
    setQuestions(aiSuggestion.updatedQuestions);
    setQuestionsDirty(true);
    setAiSuggestion(null);
    setAiMessage("");
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
          <button
            onClick={handleMatch}
            disabled={matchLoading || guests.length < 2}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-95"
          >
            {matchLoading ? "AI is sparking connections... 🤔" : party?.matchingDone ? "🔁 Re-ignite the Sparks" : "✨ Ignite the Sparks"}
          </button>
          {guests.length < 2 && <p className="text-rose-300 text-xs text-center mt-1">Need at least 2 guests</p>}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("guests")}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${activeTab === "guests" ? "bg-rose-500 text-white" : "bg-white text-rose-400 hover:bg-rose-50"}`}
          >
            👥 Guests ({guests.length})
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${activeTab === "questions" ? "bg-rose-500 text-white" : "bg-white text-rose-400 hover:bg-rose-50"}`}
          >
            ❓ Questions {questionsDirty ? "●" : ""}
          </button>
        </div>

        {/* GUESTS TAB */}
        {activeTab === "guests" && (
          <div className="space-y-3">
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
                          {guest.matchNote && <p className="text-rose-500 text-xs mt-1 italic">"{guest.matchNote}"</p>}
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
              <h3 className="font-bold text-rose-600 mb-3">🤖 AI Question Assistant</h3>
              <p className="text-xs text-rose-400 mb-3">Ask the AI to add, change, or improve questions. Examples: "Add a question about favorite movies", "Turn question 3 into multiple choice", "Make the questions spicier"</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  placeholder="Ask AI to change questions..."
                  className="flex-1 border-2 border-rose-100 focus:border-rose-400 rounded-xl px-3 py-2 outline-none text-sm text-gray-700 placeholder-gray-300"
                  onKeyDown={(e) => e.key === "Enter" && askAI()}
                />
                <button
                  onClick={askAI}
                  disabled={aiLoading || !aiMessage.trim()}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition-all text-sm"
                >
                  {aiLoading ? "..." : "Ask"}
                </button>
              </div>

              {aiSuggestion && (
                <div className="mt-3 bg-rose-50 rounded-xl p-3">
                  <p className="text-sm text-rose-700 font-medium mb-2">AI says: {aiSuggestion.suggestion}</p>
                  {aiSuggestion.updatedQuestions && (
                    <div className="flex gap-2">
                      <button onClick={acceptAISuggestion} className="bg-green-500 hover:bg-green-600 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all">
                        ✓ Accept Changes
                      </button>
                      <button onClick={() => setAiSuggestion(null)} className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold px-4 py-2 rounded-lg transition-all">
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
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
      </div>
    </main>
  );
}
