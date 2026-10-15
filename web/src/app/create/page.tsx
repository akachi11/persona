import { CreateForm } from "./CreateForm";

export default function CreatePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Create your avatar</h1>
      <p className="mt-1 mb-8 text-zinc-400">Give it a look, a personality and a voice, then mint it as an NFT you own.</p>
      <CreateForm />
    </main>
  );
}
