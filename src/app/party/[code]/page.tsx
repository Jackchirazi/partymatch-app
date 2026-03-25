"use client";

import { useState, useRef, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { questions as defaultQuestions, type Question } from "@/lib/questions";
import { defaultSettings, getTheme, type PartySettings } from "@/lib/themes";

export default function QuestionnairePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"info" | "gender" | "questions">("info");
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [settings, setSettings] = useState<PartySettings>(defaultSettings);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load party settings
    const stored = localStorage.getItem("partySettings");
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch {}
    }

    // Fetch custom questions
    const partyId = localStorage.getItem("partyId");
    if (!partyId) return;
    fetch(`/api/admin/questions?partyId=${partyId}`)
      .then((r) => r.json())
      .then((d) => { if (d.questions) setQuestions(d.questions); })
      .catch(() => {});
  }, []);

  const theme = getTheme(settings.theme);

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 300;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotoUrl(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

  async function handleSubmit() {
    if (!allAnswered) {
      setError(`Answer all questions first! (${answeredCount}/${totalQuestions} done)`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const partyId = localStorage.getItem("partyId");
      if (!partyId) throw new Error("Party not found. Go back and re-enter the code.");

      const res = await fetch("/api/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId, name: name.trim(), gender, photoUrl, answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      localStorage.setItem("guestId", data.id);
      localStorage.setItem("guestName", data.name);
      router.push(`/party/${code}/match`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Name + Photo
  if (step === "info") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm animate-fade-in">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2 font-black" style={{ color: theme.primary }}>{settings.appName}</div>
            <h1 className="text-2xl font-black text-gray-800">Welcome!</h1>
            <p className="text-gray-400 text-sm mt-1">Set up your profile</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all"
                  style={n === 1 ? { backgroundColor: theme.primary, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#94a3b8" }}
                >
                  {n}
                </div>
                {n < 3 && <div className="w-6 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>

          <div className="space-y-5">
            {/* Photo upload */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => galleryRef.current?.click()}
                className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed flex items-center justify-center overflow-hidden transition-all"
                style={{ borderColor: theme.border }}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">📸</span>
                )}
              </button>

              <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhoto} />
              <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="text-xs font-semibold px-3 py-1 rounded-full transition-all"
                  style={{ backgroundColor: theme.light, color: theme.text }}
                >
                  Camera
                </button>
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="text-xs font-semibold px-3 py-1 rounded-full transition-all"
                  style={{ backgroundColor: theme.light, color: theme.text }}
                >
                  Gallery
                </button>
              </div>
              <p className="text-xs text-gray-300 mt-1">Optional</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: theme.text }}>Your Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What do people call you?"
                className="w-full border-2 rounded-xl px-4 py-3 outline-none transition-all text-gray-700 placeholder-gray-300"
                style={{ borderColor: theme.border }}
                onFocus={(e) => e.target.style.borderColor = theme.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
                autoFocus
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              onClick={() => {
                if (!name.trim()) { setError("Enter your name first!"); return; }
                setError("");
                setStep("gender");
              }}
              className="w-full text-white font-black py-4 rounded-xl text-lg transition-all active:scale-95"
              style={{ backgroundColor: theme.primary }}
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Step 2: Gender
  if (step === "gender") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm animate-fade-in">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all"
                  style={n <= 2 ? { backgroundColor: theme.primary, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#94a3b8" }}
                >
                  {n}
                </div>
                {n < 3 && <div className="w-6 h-0.5" style={n < 2 ? { backgroundColor: theme.primary } : { backgroundColor: "#e2e8f0" }} />}
              </div>
            ))}
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-gray-800">One more thing</h1>
            <p className="text-gray-400 text-sm mt-1">This helps us find your {settings.matchLabel}</p>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { value: "male", label: "Male", emoji: "👨" },
              { value: "female", label: "Female", emoji: "👩" },
              { value: "other", label: "Other / Prefer not to say", emoji: "🌈" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGender(opt.value as typeof gender)}
                className="w-full text-left px-5 py-4 rounded-xl border-2 transition-all text-base font-semibold flex items-center gap-3"
                style={
                  gender === opt.value
                    ? { borderColor: theme.primary, backgroundColor: theme.light, color: theme.text }
                    : { borderColor: "#f1f5f9", color: "#6b7280" }
                }
              >
                <span className="text-2xl">{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { if (!gender) return; setStep("questions"); }}
            disabled={!gender}
            className="w-full text-white font-black py-4 rounded-xl text-lg transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: theme.primary }}
          >
            Let&apos;s Go!
          </button>

          <button onClick={() => setStep("info")} className="block w-full text-center text-gray-300 text-sm mt-3 hover:text-gray-400">
            ← Back
          </button>
        </div>
      </main>
    );
  }

  // Step 3: Questions
  return (
    <main className="min-h-screen p-4 pb-32">
      <div className="max-w-lg mx-auto">
        {/* Header with step indicator */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black text-gray-800">{name}&apos;s Profile</h1>
              <p className="text-xs text-gray-400">{answeredCount} of {totalQuestions} answered</p>
            </div>
            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                  style={n <= 3 ? { backgroundColor: theme.primary, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#94a3b8" }}
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%`, backgroundColor: theme.primary }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl shadow p-5">
              <p className="font-black text-gray-800 mb-3">{q.question}</p>

              {q.type === "choice" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(q.id, opt)}
                      className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium"
                      style={
                        answers[q.id] === opt
                          ? { borderColor: theme.primary, backgroundColor: theme.light, color: theme.text }
                          : { borderColor: "#f1f5f9", color: "#6b7280" }
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === "text" && (
                <input
                  type="text"
                  value={answers[q.id] || ""}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder={q.placeholder}
                  className="w-full border-2 border-gray-100 focus:border-gray-300 rounded-xl px-4 py-3 outline-none transition-all text-gray-700 placeholder-gray-300 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading || !allAnswered}
            className="w-full text-white font-black py-4 rounded-xl text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.primary }}
          >
            {loading
              ? "Submitting..."
              : allAnswered
              ? `Reveal My ${settings.matchLabel} 🔥`
              : `Answer ${totalQuestions - answeredCount} more question${totalQuestions - answeredCount !== 1 ? "s" : ""}...`}
          </button>
        </div>
      </div>
    </main>
  );
}
