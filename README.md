# Persona

> 🚧 **Work in progress.** This project is in early development. Features, structure and setup steps are likely to change, and parts of it haven't been fully tested yet.

Persona is an experiment in **AI avatars you own on-chain**. The idea: you design a character (its look, bio, personality and voice), mint it as an NFT, and then chat with it. It replies in character and can read its replies out loud.

The current version aims to run on **free tools only**, with no paid APIs or API keys required to try it locally.

## Current status

What exists so far:

- [x] ERC-721 contract with a paid mint (`PersonaNFT.sol`), with basic tests
- [x] Wallet connection through RainbowKit (MetaMask, Coinbase Wallet, WalletConnect wallets such as Trust Wallet)
- [x] Create page: describe an avatar, generate an image, pick a voice preset, mint
- [x] Gallery of minted avatars, read directly from the contract
- [x] Chat page with in-character replies and browser text-to-speech
- [x] "Wallet needs funding" prompt with testnet faucet links

Not done or not yet verified:

- [ ] The full mint flow through a real wallet hasn't been thoroughly tested yet
- [ ] Not yet deployed to a public testnet or hosted anywhere
- [ ] No frontend tests
- [ ] Error handling and mobile layout need more work
- [ ] Some design decisions below (on-chain metadata, free AI providers) may change

## How it works (for now)

| Part | Current choice | Notes |
|---|---|---|
| Smart contract | Solidity, Hardhat 2, OpenZeppelin ERC-721 | Mint requires a small ETH fee |
| Chain | Local Hardhat node, with Base Sepolia testnet planned | |
| Wallets | RainbowKit + wagmi + viem | |
| Metadata | Stored fully on-chain as a base64 data URI | Avoids needing IPFS; may move to IPFS later |
| Avatar images | [Pollinations.ai](https://pollinations.ai) image API | Free, no key, quality varies |
| Chat | Pollinations.ai text API, called from a Next.js API route | Free, rate-limited |
| Voice | Browser Web Speech API with pitch/rate presets | Free; voices differ by browser |

```
persona/
├── contracts/   Hardhat project: PersonaNFT.sol, tests, deploy and seed scripts
└── web/         Next.js app: gallery (/), /create, /avatar/[id], /api/chat
```

## Running it locally

These steps worked during development but may change. You'll need Node.js 20+ and a browser wallet such as MetaMask.

**1. Start a local blockchain** (leave it running):
```bash
cd contracts
npm install
npm run node
```
This prints test accounts that each hold fake ETH.

**2. Deploy the contract** (in a second terminal):
```bash
cd contracts
npm run deploy:localhost
```
Copy the `NEXT_PUBLIC_PERSONA_CONTRACT=...` line it prints.

Optionally, mint a sample avatar so the gallery isn't empty:
```bash
PERSONA_CONTRACT=<address> npx hardhat run scripts/seed-local.js --network localhost
```

**3. Start the web app:**
```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```
Paste the contract address into `.env.local` and keep `NEXT_PUBLIC_USE_LOCAL_CHAIN=true`.

**4. Connect MetaMask to the local chain:**
- Add a network manually: RPC URL `http://127.0.0.1:8545`, chain ID `31337`, symbol `ETH`.
- Import one of the test accounts printed in step 1. These keys are public, so never send real funds to them.

Restarting the local node wipes the chain, so you'll need to redeploy. If MetaMask gets stuck afterwards, clear its activity data (Settings → Advanced).

### Running the contract tests
```bash
cd contracts
npm test
```

## Base Sepolia testnet (planned)

The config already includes a `baseSepolia` network, but this path hasn't been fully tried yet. Roughly:

1. Create a separate test wallet (not your main wallet) and get free Base Sepolia ETH from a faucet.
2. In `contracts/`, copy `.env.example` to `.env` and set `PRIVATE_KEY`.
3. Run `npm run deploy:base-sepolia`.
4. In `web/.env.local`, set the new address and `NEXT_PUBLIC_USE_LOCAL_CHAIN=false`.

Mobile wallets connecting through WalletConnect (for example Trust Wallet on a phone) need a free project ID from [Reown](https://dashboard.reown.com) in `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.

## Known limitations

- The free AI services are rate-limited, so sending messages quickly may fail.
- Browser voices sound robotic and vary between Chrome, Safari and Firefox.
- Generated images don't always match the description closely.
- Image URLs point to Pollinations, so images depend on that service staying available.

## Ideas being considered

- Paying with testnet USDC instead of ETH
- Letting owners edit their avatar's personality
- Tips or pay-per-chat that go to the avatar's owner
- Better voice options, including cloning your own voice (with consent)
- Storing images on IPFS

## Contributing

Things are still moving quickly, but issues and suggestions are welcome.
