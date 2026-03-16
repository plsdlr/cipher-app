# Forbidden Color — Palette Index 15 Bug

## Summary

Palette index 15 (the 16th color slot) can never be minted. Selecting it causes ZK proof generation to fail with a circuit constraint error.

## Root Cause

Color is stored as a **4-bit nibble** at bits 248–251 of slot3. The encoding in `encodeSlot3` (encodingUtils.js) takes color values 1–16 (1-indexed, because the circuit rejects 0 to avoid ambiguity with padding zeros).

The problem: UI color index 15 → `color + 1 = 16` → `(16).toString(16) = "10"` — **two hex characters instead of one nibble**. This causes the full encoding string to be 64 chars instead of 63, so `padStart(64)` adds no leading zero. The `"1"` from `"10"` lands in the nibble at bits 252–255 instead of bits 248–251.

The circuit (`VerifyTrumiteSlot3`) then fails on two constraints:
1. `slot3Bits.out[252] === 0` — bit 252 is 1, not 0
2. Color extracted from bits 248–251 = 0, which is not in the valid set `{1..16}`

A valid proof cannot be generated, so no corrupted data ever reaches the chain. **This is not exploitable.**

## Circuit Range Check Bug

The circuit validates color against `{1, 2, ..., 16}` — but a 4-bit field can only hold values 0–15. Value 16 is physically unreachable. The effective valid range is **{1..15}**, meaning only **15 colors are mintable**, not 16.

## Resolution (testnet — no circuit redeploy)

Since redeploying the circuit is expensive, the palette was adjusted instead:

- **Index 5** (formerly Dark Gray `rgb(95, 87, 79)`) → swapped to **Peach** `rgb(255, 204, 170)` — mintable
- **Index 15** (formerly Peach) → swapped to **Dark Gray** `rgb(95, 87, 79)` — stays unmintable, dead slot

The `COLOR_NAMES` dropdown in `Mint.tsx` reflects this swap. Index 15 ("Gray1") remains in the dropdown but will always fail proof generation if selected.

## The +1 / -1 Offset

- **Why +1 at mint:** the circuit enforces color ≥ 1 to avoid ambiguity with padding zeros in the nibble slot
- **Why -1 at display:** `view.tsx` converts back from 1-indexed storage to 0-indexed palette array
- **Template bug:** `index_onchain_template_temp.html` was missing the `-1`, causing colors to display one step off. Fixed by using `slot3.color - 1`.

## Files Affected

- `src/utils/encodingUtils.js` — `encodeSlot3` validator says `color > 16`, should be `color > 15`
- `src/MintingPage/Mint.tsx` — `COLOR_NAMES[15]` is a dead slot
- `public/indexTurmite_deterministic_authoritative.html` — palette index 5 and 15 swapped
- `src/OnchainJS/index_onchain_template_temp.html` — palette index 5 and 15 swapped, color offset fixed
- `src/OnchainJS/index_onchain_template_temp.min.html` — needs regeneration after template changes
