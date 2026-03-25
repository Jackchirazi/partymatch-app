"use client";

import { useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { questions } from "@/lib/questions";

export default function QuestionnairePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"info" | "questions">("info");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Resize to ~200px wide using a canvas
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
    if (!name.trim()) {
      setError("Tell us your name!");
      return;
    }
    if (!allAnswered) {
      setError(`Answer all questions first! (${answeredCount}/${totalQuestions} done)`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const partyId = localStorage.getItem("partyId");
      if (!partyId) {
        throw new Error("Party not found. Go back and re-enter the code.");
      }

      const res = await fetch("/api/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId, name: name.trim(), photoUrl, answers }),
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

  if (step === "info") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm animate-fade-in">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">✨</div>
            <h1 className="text-2xl font-bold text-rose-600">Welcome!</h1>
            <p className="text-rose-400 text-sm mt-1">Let&apos;s set up your profile</p>
          </div>

          <div className="space-y-5">
            {/* Photo upload */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 rounded-full bg-rose-50 border-2 border-dashed border-rose-200 flex items-center justify-center overflow-hidden transition-all hover:border-rose-400"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="You" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">📸</span>
                )}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs text-rose-400 mt-2 hover:text-rose-600"
              >
                {photoUrl ? "Change photo" : "Add a photo (optional)"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handlePhoto}
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-rose-600 mb-1">
                Your Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What do people call you?"
                className="w-full border-2 border-rose-100 focus:border-rose-400 rounded-xl px-4 py-3 outline-none transition-all text-gray-700 placeholder-gray-300"
                autoFocus
              />
            </div>

            <button
              onClick={() => {
                if (!name.trim()) { setError("Enter your name first!"); return; }
                setError("");
                setStep("questions");
              }}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-95"
            >
              Next: Answer Questions →
            </button>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 pb-32">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center py-4 mb-2">
          <h1 className="text-xl font-bold text-rose-600">{name}&apos;s Profile</h1>
          <div className="flex items-center gap-2 justify-center mt-2">
            <div className="flex-1 bg-rose-100 rounded-full h-2 max-w-xs">
              <div
                className="bg-rose-500 h-2 rounded-full transition-all"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-rose-400 text-sm">{answeredCount}/{totalQuestions}</span>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl shadow p-5">
              <p className="font-semibold text-gray-800 mb-3">{q.question}</p>

              {q.type === "choice" && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(q.id, opt)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                        answers[q.id] === opt
                          ? "border-rose-500 bg-rose-50 text-rose-700 font-medium"
                          : "border-gray-100 hover:border-rose-200 text-gray-600"
                      }`}
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
                  className="w-full border-2 border-gray-100 focus:border-rose-400 rounded-xl px-4 py-3 outline-none transition-all text-gray-700 placeholder-gray-300 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sticky submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-rose-100">
        <div className="max-w-lg mx-auto">
          {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading || !allAnswered}
            className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all active:scale-95"
          >
            {loading
              ? "Submitting..."
              : allAnswered
              ? "Submit & Find My Match! 💘"
              : `Answer ${totalQuestions - answeredCount} more question${totalQuestions - answeredCount !== 1 ? "s" : ""}...`}
          </button>
        </div>
      </div>
    </main>
  );
}
