"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { defaultSettings, getTheme, type PartySettings } from "@/lib/themes";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

type Partner = {
  id: string;
  name: string;
  photoUrl: string | null;
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function ChatPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const [guestId, setGuestId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [settings, setSettings] = useState<PartySettings>(defaultSettings);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noMatch, setNoMatch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("guestId");
    if (!id) {
      router.push("/login");
      return;
    }
    setGuestId(id);
    setGuestName(localStorage.getItem("guestName") || "You");

    const stored = localStorage.getItem("partySettings");
    if (stored) {
      try { setSettings({ ...defaultSettings, ...JSON.parse(stored) }); } catch {}
    }
  }, [router]);

  async function fetchMessages(id: string) {
    try {
      const res = await fetch(`/api/messages?guestId=${id}`);
      const data = await res.json();
      // Sync fresh settings from server every poll
      if (data.settings) {
        const fresh = { ...defaultSettings, ...data.settings };
        setSettings(fresh);
        localStorage.setItem("partySettings", JSON.stringify(data.settings));
      }
      if (data.partner) {
        setPartner(data.partner);
        setNoMatch(false);
      } else {
        setNoMatch(true);
      }
      setMessages(data.messages || []);
      setLoading(false);
    } catch {}
  }

  useEffect(() => {
    if (!guestId) return;
    fetchMessages(guestId);
    pollRef.current = setInterval(() => fetchMessages(guestId), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || sending || !guestId) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: guestId, content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
      }
    } catch {}
    setSending(false);
  }

  const theme = getTheme(settings.theme);
  const { matchLabel, blindMode } = settings;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 font-semibold animate-pulse">Loading chat...</div>
      </main>
    );
  }

  if (noMatch) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4 animate-pulse">⏳</div>
        <h1 className="text-xl font-black text-gray-800 mb-2">No match yet</h1>
        <p className="text-gray-400 text-sm mb-6">Waiting for the host to reveal matches...</p>
        <div className="flex gap-2 justify-center mb-6">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.textLight, animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.text, animationDelay: "300ms" }} />
        </div>
        <button onClick={() => router.back()} className="text-gray-300 text-sm hover:text-gray-400">← Go back</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ maxHeight: "100dvh" }}>
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        {blindMode ? (
          <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 text-xl" style={{ backgroundColor: theme.lighter, borderColor: theme.border }}>
            ❓
          </div>
        ) : partner?.photoUrl ? (
          <img src={partner.photoUrl} alt={partner.name} className="w-10 h-10 rounded-full object-cover border-2" style={{ borderColor: theme.border }} />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 font-black text-lg" style={{ backgroundColor: theme.lighter, borderColor: theme.border, color: theme.text }}>
            {partner?.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-black text-gray-800 text-sm">{blindMode ? "???" : partner?.name}</div>
          <div className="text-xs" style={{ color: theme.textLight }}>Your {matchLabel}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-gray-400">You</div>
          <div className="text-xs font-bold text-gray-600">{guestName}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-12">
            <div className="text-4xl mb-3">👋</div>
            Say hi to your {matchLabel}!
          </div>
        )}
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === guestId;
          const isFirstInRun = index === 0 || messages[index - 1].senderId !== msg.senderId;
          const senderName = isOwn ? guestName : (blindMode ? "???" : partner?.name);
          return (
            <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
              {isFirstInRun && (
                <div className="text-xs font-semibold text-gray-400 mb-1 px-1">
                  {senderName}
                </div>
              )}
              <div className="max-w-[75%]">
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm font-medium break-words"
                  style={
                    isOwn
                      ? { backgroundColor: theme.primary, color: "#fff", borderBottomRightRadius: "4px" }
                      : { backgroundColor: "#f1f5f9", color: "#374151", borderBottomLeftRadius: "4px" }
                  }
                >
                  {msg.content}
                </div>
                <div className={`text-xs text-gray-300 mt-1 ${isOwn ? "text-right" : "text-left"}`}>
                  {timeAgo(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={`Message your ${matchLabel}...`}
          className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-rose-200 outline-none text-sm"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="px-4 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-40 transition-all active:scale-95"
          style={{ backgroundColor: theme.primary }}
        >
          Send
        </button>
      </div>
    </main>
  );
}
