"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useReadContract } from "wagmi";
import { PERSONA_ADDRESS, personaAbi } from "@/lib/contract";
import { decodeMetadata, speak, VOICE_PRESETS } from "@/lib/persona";
import { targetChain } from "@/lib/wagmi";
import { SetupNotice } from "@/components/SetupNotice";

type Message = { role: "user" | "assistant"; content: string };

export function AvatarChat() {
  const { id } = useParams<{ id: string }>();
  const tokenId = /^\d+$/.test(id) ? BigInt(id) : null;

  const read = { address: PERSONA_ADDRESS, abi: personaAbi, chainId: targetChain.id } as const;
  const enabled = !!PERSONA_ADDRESS && tokenId !== null;
  const { data: uri, isLoading, isError } = useReadContract({
    ...read,
    functionName: "tokenURI",
    args: [tokenId ?? 0n],
    query: { enabled },
  });
  const { data: owner } = useReadContract({ ...read, functionName: "ownerOf", args: [tokenId ?? 0n], query: { enabled } });

  const meta = uri ? decodeMetadata(uri) : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Some browsers load voices asynchronously; touching the list early warms it up.
  useEffect(() => {
    window.speechSynthesis?.getVoices();
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !meta || sending) return;
    const next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: meta.name,
          bio: meta.description,
          personality: meta.persona.personality,
          messages: next,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setMessages([...next, { role: "assistant", content: data.reply }]);
      if (voiceOn) speak(data.reply, meta.persona.voice);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  if (!PERSONA_ADDRESS) return <SetupNotice />;
  if (tokenId === null || isError) return <p className="text-zinc-400">This avatar doesn&apos;t exist.</p>;
  if (isLoading || !uri) return <p className="text-zinc-400">Loading avatar…</p>;
  if (!meta) return <p className="text-zinc-400">This avatar&apos;s metadata couldn&apos;t be read.</p>;

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meta.image} alt={meta.name} className="aspect-square w-full rounded-2xl border border-white/10 object-cover" />
        <h1 className="text-2xl font-bold">{meta.name}</h1>
        <p className="text-sm text-zinc-400">{meta.description}</p>
        <p className="text-xs text-zinc-500">
          Voice: {VOICE_PRESETS[meta.persona.voice]?.label ?? "Default"} · Token #{id}
        </p>
        {owner && (
          <p className="break-all font-mono text-xs text-zinc-500">
            Owner:{" "}
            {targetChain.blockExplorers?.default ? (
              <a
                href={`${targetChain.blockExplorers.default.url}/address/${owner}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {owner}
              </a>
            ) : (
              owner
            )}
          </p>
        )}
        <Link href="/" className="inline-block text-sm text-violet-400 underline">
          ← All avatars
        </Link>
      </aside>

      <section className="flex h-[70vh] flex-col rounded-2xl border border-white/10 bg-zinc-900">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-sm">
          <span className="text-zinc-400">Chat with {meta.name}</span>
          <label className="flex items-center gap-2 text-zinc-300">
            <input
              type="checkbox"
              checked={voiceOn}
              onChange={(e) => {
                setVoiceOn(e.target.checked);
                if (!e.target.checked) window.speechSynthesis?.cancel();
              }}
            />
            Voice
          </label>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && <p className="text-sm text-zinc-500">Say hi to {meta.name}.</p>}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-violet-600" : "bg-zinc-800"
                }`}
              >
                {m.content}
                {m.role === "assistant" && (
                  <button
                    onClick={() => speak(m.content, meta.persona.voice)}
                    className="ml-2 text-xs text-zinc-400 hover:text-white"
                    aria-label="Play reply"
                  >
                    ▶
                  </button>
                )}
              </div>
            </div>
          ))}
          {sending && <p className="animate-pulse text-sm text-zinc-500">{meta.name} is thinking…</p>}
          <div ref={bottomRef} />
        </div>
        {error && <p className="px-4 pb-1 text-xs text-red-400">{error}</p>}
        <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            maxLength={1000}
            className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <button
            disabled={sending || !draft.trim()}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
