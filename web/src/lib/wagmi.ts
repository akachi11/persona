import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, hardhat } from "wagmi/chains";

// Set NEXT_PUBLIC_USE_LOCAL_CHAIN=true to develop against `npx hardhat node`
// (no faucet needed). Otherwise the app uses the Base Sepolia testnet.
export const USE_LOCAL_CHAIN = process.env.NEXT_PUBLIC_USE_LOCAL_CHAIN === "true";
export const targetChain = USE_LOCAL_CHAIN ? hardhat : baseSepolia;

// Free project ID from https://dashboard.reown.com — needed for WalletConnect
// (Trust Wallet mobile, Rainbow, etc.). Browser-extension wallets work without it.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "MISSING_PROJECT_ID";

export const config = getDefaultConfig({
  appName: "Persona",
  projectId,
  chains: [targetChain],
  ssr: true,
});
