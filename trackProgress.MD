# Development Progress Tracker

## Session Date: 2025-10-20

### 1. Updated ProofSystem.tsx for New Circuit

**Issue:** The proof system was using outdated circuit references and missing required parameters.

**Changes Made:**
- Added `myPublicKey` parameter to `generateProofTransfer` function signature (line 30)
- Added `myPublicKey` to the circuit input object (lines 85-88)
- Updated WASM file path from `ecdh-poseidon-cipher-transfer.wasm` to `ecdh-poseidon-key-derivation-cipher-transfer.wasm` (line 96)

**Files Modified:**
- `src/ProofSystem/ProofSystem.tsx`

**Reasoning:**
The circom test code showed that the new circuit requires `myPublicKey` as both an input and a public signal. The old WASM file was deleted and replaced with the key-derivation version.

---

### 2. Added Mint Payment Requirement

**Issue:** The new contract requires 0.1 ether payment for minting, but the frontend wasn't sending any value.

**Changes Made:**
- Added `value: BigInt(100000000000000000)` (0.1 ether in wei) to the mint transaction in `MintConnector.tsx` (line 51)

**Files Modified:**
- `src/MintingPage/MintConnector.tsx`

**Reasoning:**
Contract now has a payable mint function that requires exactly 0.1 ether to mint a new NFT.

---

### 3. Implemented Public Key Registration Feature

**Issue:** The `registerPublicKey` contract function existed in the ABI but had no UI implementation. Users couldn't register their cipher wallet public keys on-chain, preventing them from receiving NFTs.

**Investigation:**
- Found `registerPublicKey` in contract ABI
- Discovered `WalletPage.tsx` was checking if keys were registered but had no button to actually register them
- Verified the check at line 136-141 in `viewList.tsx` that validates recipient has registered keys

**Changes Made:**

#### 3.1 Added UI Elements (WalletPage.tsx)
- Added registration section that appears when:
  - Cipher wallet is ACTIVE
  - ETH wallet is connected
  - Public key is NOT yet registered on-chain
- Shows "⚠ Action Required" message with registration button
- Shows "✓ Public Key Registered" status when already registered
- Button appears before the "Reset Wallet" button in Wallet Controls section

#### 3.2 Implemented Contract Call Functionality
- Added `useWriteContract` hook for blockchain transactions (lines 49-54)
- Created `handleRegisterPublicKey` function (lines 232-255):
  - Validates public key exists
  - Calls contract's `registerPublicKey` with public key coordinates [x, y]
  - Logs detailed progress to console
- Added transaction monitoring (lines 309-324):
  - Shows success/error messages
  - Displays transaction hash
  - Auto-refetches registration status after 3 seconds

#### 3.3 Button Behavior
- Disabled while transaction is pending
- Shows "Registering..." during processing
- Updates to success state after confirmation

**Files Modified:**
- `src/WalletPage.tsx`

**User Flow:**
1. User creates/imports cipher wallet → Wallet state: ACTIVE
2. User connects ETH wallet → Registration section appears
3. User clicks "Register Public Key On-Chain" → Transaction submitted to blockchain
4. After confirmation → UI automatically updates to show registered status
5. User can now receive NFT transfers (viewList.tsx validates this)

---

## Technical Notes

### Circuit Input Structure
The transfer proof now requires these inputs:
- `myPrivateKey`: Derived secret scalar
- `oldSenderPublicKey`: [x, y] coordinates
- `newReciverPublicKey`: [x, y] coordinates
- `oldResultKey`: ECDH shared key [x, y]
- `newResultKey`: ECDH shared key [x, y]
- `oldMessage`: [field1, field2, field3]
- `newMessage`: [field1, field2, field3]
- `oldComputedCipherText`: [c1, c2, c3, c4]
- `newComputedCipherText`: [c1, c2, c3, c4]
- `oldNonce`: nonce value
- `newNonce`: nonce value
- `myPublicKey`: [x, y] coordinates (NEW - required by new circuit)

### Contract Functions Used
- `mint()`: Now requires 0.1 ether payment
- `registerPublicKey(uint256 x, uint256 y)`: Registers user's cipher public key on-chain
- `userPublicKeys(address, uint256)`: Reads registered public key coordinates

---

## Files Changed Summary

1. `src/ProofSystem/ProofSystem.tsx` - Updated for new circuit
2. `src/MintingPage/MintConnector.tsx` - Added mint payment
3. `src/WalletPage.tsx` - Added public key registration UI and functionality

---

## Testing Checklist

- [ ] Verify mint transaction requires and sends 0.1 ether
- [ ] Test public key registration with fresh wallet
- [ ] Confirm registration status updates after transaction
- [ ] Test NFT transfer with registered recipient
- [ ] Test NFT transfer fails with unregistered recipient
- [ ] Verify proof generation includes myPublicKey parameter
- [ ] Test proof verification with new circuit WASM file

---

## Known Issues / TODO

- Consider adding `.toString()` conversions for circuit inputs if needed (currently omitted)
- May need to handle transaction confirmation waiting better
- Consider adding explicit wait for transaction receipt before refetching registration status

---

## Session Date: 2025-10-21

### 4. Created Reusable Transaction Components

**Issue:** Transaction states (pending/confirming/success) were handled inconsistently across the app with duplicated code and missing transaction hash tracking.

**Root Cause:** In wagmi v2, `writeContract()` doesn't return the hash—it's available from the hook's `data` property. All marketplace hooks incorrectly awaited the return value.

**Changes Made:**

1. **Fixed Transaction Hash Handling** (3 files):
   - Updated `useMakeOffer.ts`, `useCancelOffer.ts`, `useFulfillOffer.ts`
   - Changed from `const hash = await writeContract()` to `data: txHash` destructuring
   - Removed manual state management for txHash

2. **Created Reusable Components** (3 new files):
   - `src/components/TransactionButton.tsx` - Handles button states (idle/submitting/confirming)
   - `src/components/TransactionStatus.tsx` - Displays transaction progress and hash
   - `src/components/index.ts` - Barrel exports

3. **Refactored All Transaction Flows** (4 files):
   - `MarketPage.tsx` - Deposit ETH
   - `WalletPage.tsx` - Register public key
   - `MintConnector.tsx` - Mint NFT
   - `viewList.tsx` - Send/Transfer NFT

**Impact:** Consistent UX across all blockchain transactions with automatic state handling and transaction hash display.

**Files Modified:**
- `src/Nightmarket/useMakeOffer.ts`, `useCancelOffer.ts`, `useFulfillOffer.ts`
- `src/components/TransactionButton.tsx`, `TransactionStatus.tsx`, `index.ts`
- `src/Nightmarket/MarketPage.tsx`
- `src/WalletPage.tsx`
- `src/MintingPage/MintConnector.tsx`
- `src/ViewAndSendPage/viewList.tsx`
