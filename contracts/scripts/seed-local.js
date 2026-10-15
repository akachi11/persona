// Mints one sample avatar on the local chain so the gallery isn't empty.
const hre = require("hardhat");

async function main() {
  const address = process.env.PERSONA_CONTRACT;
  if (!address) throw new Error("Set PERSONA_CONTRACT=<deployed address>");
  const persona = await hre.ethers.getContractAt("PersonaNFT", address);
  const look = "a friendly pirate robot with a neon parrot";
  const meta = {
    name: "Captain Byte",
    description: "Sails the blockchain seas looking for lost tokens.",
    image: `https://image.pollinations.ai/prompt/${encodeURIComponent(
      `portrait avatar of ${look}, centered, vibrant, digital art, clean background`
    )}?width=512&height=512&seed=42&nologo=true`,
    attributes: [
      { trait_type: "Voice", value: "Deep" },
      { trait_type: "Look", value: look },
    ],
    persona: { personality: "Witty, speaks like a pirate, explains crypto with sea metaphors.", voice: "deep" },
  };
  const uri = "data:application/json;base64," + Buffer.from(JSON.stringify(meta)).toString("base64");
  const tx = await persona.mint(uri, { value: await persona.mintPrice() });
  await tx.wait();
  console.log(`Minted sample avatar. totalMinted = ${await persona.totalMinted()}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
