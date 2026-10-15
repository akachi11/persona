import { Suspense } from "react";
import { AvatarChat } from "./AvatarChat";

export default function AvatarPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <Suspense fallback={<p className="text-zinc-400">Loading avatar…</p>}>
        <AvatarChat />
      </Suspense>
    </main>
  );
}
