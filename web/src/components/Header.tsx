"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Persona<span className="text-violet-400">.</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/create" className="hidden text-zinc-300 hover:text-white sm:inline">
            Create
          </Link>
          <ConnectButton chainStatus="icon" showBalance={false} />
        </nav>
      </div>
    </header>
  );
}
