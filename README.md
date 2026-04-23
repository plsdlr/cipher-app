# Cipher V0.1 — Frontend

This is the frontend for [Cipher](https://cipher.plsldr.net), an artwork by [Paul Seidler](https://plsldr.net). Cipher is a collection of encrypted generative artworks on Ethereum mainnet. Each token is a turmite — a two-dimensional Turing machine — whose parameters are encrypted on-chain. Only the holder's cryptographic key can decrypt and render the piece.

All original code is licensed under the GNU Affero General Public License. Third-party libraries retain their original licenses.

## Stack

- React + Vite + TypeScript
- [wagmi](https://wagmi.sh) / [viem](https://viem.sh) for Ethereum
- [snarkjs](https://github.com/iden3/snarkjs) + Groth16 circuits for ZK proofs
- [zk-kit](https://github.com/privacy-scaling-explorations/zk-kit) for Baby JubJub, EdDSA-Poseidon, and Poseidon encryption

## Getting started

**Prerequisites:** Node.js, [pnpm](https://pnpm.io)

```bash
pnpm install
```

Create a `.env.local` file with your Ethereum mainnet RPC endpoint:

```
VITE_RPC_URL=https://your-rpc-endpoint
```

```bash
pnpm dev       # start dev server at http://localhost:5173
pnpm build     # type-check and build for production
pnpm preview   # preview the production build locally
```

## Project structure

```
src/
  cipherWallet/     # Baby JubJub keypair, AES-GCM password backup, session storage
  ProofSystem/      # snarkjs Groth16 proof generation for token transfers
  MintingPage/      # /mint — mint a new token
  ViewAndSendPage/  # /view — decrypt and view owned tokens, send to others
  ReCipher/         # /recipher — re-encrypt a token with one modified parameter
  Nightmarket/      # /market — peer-to-peer token marketplace
  contractABI/      # ABIs and mainnet/Sepolia addresses for the three contracts
  utils/            # Turmite parameter encoding (Circom field packing/unpacking)
public/
  circuit_transfer/         # WASM + zkey for the transfer proof circuit
  circuit_turmites/         # WASM + zkey for the re-cipher proof circuit
  indexTurmite_deterministic_authoritative.html  # self-contained turmite renderer (used as iframe)
```
