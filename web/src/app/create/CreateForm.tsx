"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatEther, parseEventLogs } from "viem";
import {
  useAccount,
  useBalance,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { PERSONA_ADDRESS, personaAbi } from "@/lib/contract";
import { avatarImageUrl, encodeMetadata, speak, VOICE_PRESETS, type VoicePreset } from "@/lib/persona";
import { targetChain, USE_LOCAL_CHAIN } from "@/lib/wagmi";
import { SetupNotice } from "@/components/SetupNotice";

const FAUCETS = [
  { name: "Coinbase faucet", url: "https://portal.cdp.coinbase.com/products/faucet" },
  { name: "Superchain faucet", url: "https://console.optimism.io/faucet" },
];

const input =
  "w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-violet-500";

export function CreateForm() {
  const [name, setName] = useState("");
  const [look, setLook] = useState("");
  const [bio, setBio] = useState("");
  const [personality, setPersonality] = useState("");
  const [voice, setVoice] = useState<VoicePreset>("calm");
  const [seed, setSeed] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { data: balance } = useBalance({ address, chainId: targetChain.id });
  const { data: mintPrice } = useReadContract({
    address: PERSONA_ADDRESS,
    abi: personaAbi,
    functionName: "mintPrice",
    chainId: targetChain.id,
    query: { enabled: !!PERSONA_ADDRESS },
  });

  const { writeContract, data: txHash, isPending: isSigning, error: writeError, reset } = useWriteContract();
  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const mintedId = useMemo(() => {
    if (!receipt) return null;
    const [log] = parseEventLogs({ abi: personaAbi, eventName: "PersonaMinted", logs: receipt.logs });
    return log?.args.tokenId ?? null;
  }, [receipt]);

  const imageUrl = seed !== null && look.trim() ? avatarImageUrl(look.trim(), seed) : null;
  const formComplete = name.trim() && bio.trim() && personality.trim() && imageUrl && imageLoaded;
  const wrongChain = isConnected && chainId !== targetChain.id;
  // Leave a little headroom for gas.
  const needsFunds = balance !== undefined && mintPrice !== undefined && balance.value < mintPrice + mintPrice / 2n;

  function generateImage() {
    setImageLoaded(false);
    setSeed(Math.floor(Math.random() * 1_000_000));
  }

  function mint() {
    if (!PERSONA_ADDRESS || mintPrice === undefined || !imageUrl) return;
    reset();
    const uri = encodeMetadata({
      name: name.trim(),
      description: bio.trim(),
      image: imageUrl,
      attributes: [
        { trait_type: "Voice", value: VOICE_PRESETS[voice].label },
        { trait_type: "Look", value: look.trim() },
      ],
      persona: { personality: personality.trim(), voice },
    });
    writeContract({
      address: PERSONA_ADDRESS,
      abi: personaAbi,
      functionName: "mint",
      args: [uri],
      value: mintPrice,
      chainId: targetChain.id,
    });
  }

  if (!PERSONA_ADDRESS) return <SetupNotice />;

  if (mintedId !== null) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-lg font-semibold">{name} is live! 🎉</p>
        <p className="mt-1 text-sm text-zinc-300">Minted as token #{mintedId.toString()}.</p>
        <Link
          href={`/avatar/${mintedId}`}
          className="mt-4 inline-block rounded-lg bg-violet-600 px-4 py-2 font-medium hover:bg-violet-500"
        >
          Talk to {name}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">Name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Captain Byte" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">What does it look like?</span>
          <input className={input} value={look} onChange={(e) => setLook(e.target.value)} maxLength={150} placeholder="a friendly pirate robot with a neon parrot" />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">Short bio</span>
          <textarea className={input} rows={2} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Sails the blockchain seas looking for lost tokens." />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-zinc-300">Personality (how it talks)</span>
          <textarea className={input} rows={3} value={personality} onChange={(e) => setPersonality(e.target.value)} maxLength={400} placeholder="Witty, speaks like a pirate, loves explaining crypto with sea metaphors." />
        </label>
        <div className="space-y-1">
          <span className="text-sm text-zinc-300">Voice</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(VOICE_PRESETS) as VoicePreset[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setVoice(key);
                  speak(`Hi, I'm ${name || "your avatar"}.`, key);
                }}
                className={`rounded-full border px-3 py-1 text-sm ${
                  voice === key ? "border-violet-500 bg-violet-500/20" : "border-white/10 hover:border-white/30"
                }`}
              >
                {VOICE_PRESETS[key].label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">Click a voice to hear it. Uses your browser&apos;s built-in speech.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-center text-sm text-zinc-500">
          {imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={imageUrl}
                src={imageUrl}
                alt="Avatar preview"
                onLoad={() => setImageLoaded(true)}
                className={`h-full w-full object-cover ${imageLoaded ? "" : "hidden"}`}
              />
              {!imageLoaded && <span className="animate-pulse p-4">Generating… (can take ~20s)</span>}
            </>
          ) : (
            <span className="p-4">Describe the look, then generate an image</span>
          )}
        </div>
        <button
          type="button"
          onClick={generateImage}
          disabled={!look.trim()}
          className="w-full rounded-lg border border-white/15 px-4 py-2 text-sm hover:border-white/40 disabled:opacity-40"
        >
          {seed === null ? "Generate image" : "Try another image"}
        </button>

        <div className="space-y-2 rounded-2xl border border-white/10 bg-zinc-900 p-4 text-sm">
          {mintPrice !== undefined && (
            <p className="flex justify-between">
              <span className="text-zinc-400">Mint price</span>
              <span>{formatEther(mintPrice)} ETH</span>
            </p>
          )}
          {balance && (
            <p className="flex justify-between">
              <span className="text-zinc-400">Your balance</span>
              <span>{Number(formatEther(balance.value)).toFixed(5)} ETH</span>
            </p>
          )}

          {!isConnected ? (
            <div className="pt-2">
              <ConnectButton label="Connect wallet to mint" />
            </div>
          ) : wrongChain ? (
            <button
              onClick={() => switchChain({ chainId: targetChain.id })}
              disabled={isSwitching}
              className="w-full rounded-lg bg-amber-600 px-4 py-2 font-medium hover:bg-amber-500"
            >
              Switch to {targetChain.name}
            </button>
          ) : needsFunds ? (
            <div className="space-y-2 rounded-lg bg-amber-500/10 p-3 text-amber-200">
              <p>Your wallet needs a little test ETH to mint.</p>
              {USE_LOCAL_CHAIN ? (
                <p className="text-xs">Import one of the funded accounts printed by `npx hardhat node` into your wallet.</p>
              ) : (
                <ul className="list-inside list-disc text-xs">
                  {FAUCETS.map((f) => (
                    <li key={f.url}>
                      <a href={f.url} target="_blank" rel="noreferrer" className="underline">
                        {f.name}
                      </a>{" "}
                      (choose Base Sepolia)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <button
              onClick={mint}
              disabled={!formComplete || isSigning || isConfirming}
              className="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium hover:bg-violet-500 disabled:opacity-40"
            >
              {isSigning ? "Confirm in your wallet…" : isConfirming ? "Minting…" : "Mint avatar"}
            </button>
          )}

          {writeError && (
            <p className="break-words text-xs text-red-400">
              {"shortMessage" in writeError ? (writeError.shortMessage as string) : writeError.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
