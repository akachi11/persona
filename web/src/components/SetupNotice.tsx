export function SetupNotice() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
      No contract configured. Deploy the contract (see README) and set{" "}
      <code className="font-mono">NEXT_PUBLIC_PERSONA_CONTRACT</code> in{" "}
      <code className="font-mono">web/.env.local</code>, then restart the dev server.
    </div>
  );
}
