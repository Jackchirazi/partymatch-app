"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Floating background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-6 w-36 h-36 rounded-full bg-pink-300 opacity-20 animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-32 right-4 w-24 h-24 rounded-full bg-purple-300 opacity-20 animate-float" style={{ animationDelay: "1.2s" }} />
        <div className="absolute bottom-40 left-10 w-28 h-28 rounded-full bg-blue-300 opacity-20 animate-float" style={{ animationDelay: "2.1s" }} />
        <div className="absolute bottom-24 right-8 w-20 h-20 rounded-full bg-pink-400 opacity-20 animate-float" style={{ animationDelay: "0.7s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-200 opacity-10 animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative z-10 text-center mb-10 animate-fade-in">
        <div className="text-8xl mb-4 animate-float">🎉</div>
        <h1 className="text-5xl font-black text-gradient mb-3">Party Match</h1>
        <p className="text-rose-500 text-lg font-medium">Find your perfect match tonight</p>
      </div>

      <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs animate-fade-in">
        <Link
          href="/join"
          className="bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black py-5 px-8 rounded-2xl text-xl text-center shadow-xl transition-all"
        >
          Join a Party
        </Link>
        <Link
          href="/host"
          className="bg-white hover:bg-rose-50 active:scale-95 text-rose-500 font-black py-5 px-8 rounded-2xl text-xl text-center shadow-xl border-2 border-rose-200 transition-all"
        >
          Host a Party
        </Link>
      </div>

      <div className="relative z-10 mt-8 flex flex-col items-center gap-2">
        <Link href="/admin" className="text-rose-400 hover:text-rose-500 text-sm transition-all">
          Admin Login
        </Link>
        <p className="text-rose-300 text-xs">Powered by AI</p>
      </div>
    </main>
  );
}
