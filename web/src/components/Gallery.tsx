"use client";

import Link from "next/link";
import { useReadContract, useReadContracts } from "wagmi";
import { PERSONA_ADDRESS, personaAbi } from "@/lib/contract";
import { decodeMetadata } from "@/lib/persona";
import { targetChain } from "@/lib/wagmi";
import { SetupNotice } from "./SetupNotice";

const MAX_SHOWN = 24;

export function Gallery() {
  const { data: total, isLoading } = useReadContract({
    address: PERSONA_ADDRESS,
    abi: personaAbi,
    functionName: "totalMinted",
    chainId: targetChain.id,
    query: { enabled: !!PERSONA_ADDRESS },
  });

  const count = total ? Number(total) : 0;
  // Newest first.
  const ids = Array.from({ length: Math.min(count, MAX_SHOWN) }, (_, i) => BigInt(count - 1 - i));

  const { data: uris } = useReadContracts({
    contracts: ids.map((id) => ({
      address: PERSONA_ADDRESS,
      abi: personaAbi,
      functionName: "tokenURI" as const,
      args: [id] as const,
      chainId: targetChain.id,
    })),
    query: { enabled: ids.length > 0 },
  });

  if (!PERSONA_ADDRESS) return <SetupNotice />;
  if (isLoading) return <p className="text-zinc-400">Loading avatars…</p>;
  if (count === 0)
    return (
      <p className="text-zinc-400">
        No avatars yet.{" "}
        <Link href="/create" className="text-violet-400 underline">
          Be the first to create one.
        </Link>
      </p>
    );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {ids.map((id, i) => {
        const uri = uris?.[i]?.result as string | undefined;
        const meta = uri ? decodeMetadata(uri) : null;
        return (
          <Link
            key={id.toString()}
            href={`/avatar/${id}`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 transition hover:border-violet-500/60"
          >
            <div className="aspect-square bg-zinc-800">
              {meta && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={meta.image} alt={meta.name} className="h-full w-full object-cover" loading="lazy" />
              )}
            </div>
            <div className="p-3">
              <p className="truncate font-semibold">{meta?.name ?? `#${id}`}</p>
              <p className="line-clamp-2 text-xs text-zinc-400">{meta?.description ?? "Loading…"}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
