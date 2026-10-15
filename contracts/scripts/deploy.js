const hre = require("hardhat");

async function main() {
  const mintPrice = hre.ethers.parseEther(process.env.MINT_PRICE_ETH || "0.0001");
  const persona = await hre.ethers.deployContract("PersonaNFT", [mintPrice]);
  await persona.waitForDeployment();

  const address = await persona.getAddress();
  console.log(`PersonaNFT deployed to ${address} on ${hre.network.name}`);
  console.log(`Mint price: ${hre.ethers.formatEther(mintPrice)} ETH`);
  console.log(`\nPut this in web/.env.local:\nNEXT_PUBLIC_PERSONA_CONTRACT=${address}`);
  console.log(`\nVerify with:\nnpx hardhat verify --network ${hre.network.name} ${address} ${mintPrice}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
