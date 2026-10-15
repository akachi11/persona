import Link from "next/link";
import { Gallery } from "@/components/Gallery";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12">
      <section className="mb-14 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AI avatars you <span className="text-violet-400">own</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-400">
          Design a character, give it a personality and a voice, and mint it on-chain. Then talk to it — it answers out
          loud, in character.
        </p>
        <Link
          href="/create"
          className="mt-6 inline-block rounded-lg bg-violet-600 px-5 py-2.5 font-medium hover:bg-violet-500"
        >
          Create an avatar
        </Link>
      </section>

      <h2 className="mb-4 text-xl font-semibold">Latest avatars</h2>
      <Gallery />
    </main>
  );
}
