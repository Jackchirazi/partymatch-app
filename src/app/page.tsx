"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10 animate-fade-in">
        <div className="text-7xl mb-4 animate-bounce-soft">💘</div>
        <h1 className="text-4xl font-bold text-rose-600 mb-2">Party Match</h1>
        <p className="text-rose-400 text-lg">Find your perfect match tonight!</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs animate-fade-in">
        <Link
          href="/join"
          className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-4 px-8 rounded-2xl text-xl text-center shadow-lg transition-all active:scale-95"
        >
          🎉 Join a Party
        </Link>
        <Link
          href="/host"
          className="bg-white hover:bg-rose-50 text-rose-500 font-bold py-4 px-8 rounded-2xl text-xl text-center shadow-lg border-2 border-rose-200 transition-all active:scale-95"
        >
          🎂 Host a Party
        </Link>
      </div>

      <Link
        href="/admin"
        className="mt-6 text-rose-300 hover:text-rose-400 text-sm transition-all"
      >
        🔐 Admin Login
      </Link>

      <p className="mt-4 text-rose-300 text-sm text-center">
        Powered by AI ✨
      </p>
    </main>
  );
}
