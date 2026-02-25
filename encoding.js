// Standalone encoding module for Circom 254-bit field slots (encode-only)
//
// Data layout across 3 slots (each must fit in a 254-bit field):
//   Slot 1: 15 position pairs (30 x uint8)                                          = 240 bits
//   Slot 2: 3 position pairs (48 bits) + ruleset1 (96 bits) + ruleset2 (96 bits)     = 240 bits
//   Slot 3: 2 position pairs (32 bits) + ruleset3 (96 bits) + ruleset4 (96 bits)
//           + 3 additional values (24 bits) + color nibble (4 bits)                   = 252 bits
//
// Input requirements:
//   - positions: array of 20 {x, y} objects, x and y are uint8 (0-255)
//   - rulesets:  array of 4 hex strings, each 24 chars (96 bits)
//   - additionalValues: array of 3 uint8 values
//     [0] = FRAMES_PER_PUSHER_UPDATE, [1] = FRAMES_PER_CLEANER_UPDATE, [2] = rectangleCount
//   - color: integer 1-16 (pico8 palette index)
//
// Output: array of 3 hex strings (0x-prefixed, 64 hex chars each), convertible to BigInt

function byteToHex(number) {
    return (number & 0xFF).toString(16).padStart(2, '0');
}

function encodePositionsHexString(positions) {
    let hexString = '';
    for (let i = 0; i < positions.length; i++) {
        const x = positions[i].x || 0;
        const y = positions[i].y || 0;
        const safeX = Math.min(255, Math.max(0, x)) & 0xFF;
        const safeY = Math.min(255, Math.max(0, y)) & 0xFF;
        // Little-endian: y before x, prepend each pair
        const pairHex = byteToHex(safeY) + byteToHex(safeX);
        hexString = pairHex + hexString;
    }
    return hexString;
}

function encodeSlot1(posPairs) {
    const positions = encodePositionsHexString(posPairs);
    return "0x" + positions.padStart(64, '0');
}

function encodeSlot2(rule1, rule2, posPairs) {
    const positions = encodePositionsHexString(posPairs);
    const fullEncoding = rule2 + rule1 + positions;
    return "0x" + fullEncoding.padStart(64, '0');
}

function encodeSlot3(rule3, rule4, posPairs, additionalValues, color) {
    if (color < 1 || color > 16 || !Number.isInteger(color)) {
        throw new Error(`Color must be an integer between 1 and 16, got: ${color}`);
    }
    const positions = encodePositionsHexString(posPairs);
    const additionalValuesHex = byteToHex(additionalValues[2]) + byteToHex(additionalValues[1]) + byteToHex(additionalValues[0]);
    const colorHex = color.toString(16);
    const fullEncoding = colorHex + additionalValuesHex + rule4 + rule3 + positions;
    return "0x" + fullEncoding.padStart(64, '0');
}

/**
 * Encode all turmite data into 3 Circom-compatible slots.
 *
 * @param {Array<{x: number, y: number}>} positions - 20 position pairs (uint8 values)
 * @param {string[]} rulesets - 4 hex strings, 24 chars each
 * @param {number[]} additionalValues - 3 uint8 values [pusherSlowness, cleanerSlowness, rectCount]
 * @param {number} color - pico8 palette index (1-16)
 * @returns {string[]} 3 hex-encoded slot strings (0x-prefixed)
 */
function encodeAll(positions, rulesets, additionalValues, color) {
    const slot1 = encodeSlot1(positions.slice(0, 15));
    const slot2 = encodeSlot2(rulesets[0], rulesets[1], positions.slice(15, 18));
    const slot3 = encodeSlot3(rulesets[2], rulesets[3], positions.slice(18, 20), additionalValues, color);
    return [slot1, slot2, slot3];
}

/**
 * Convert hex slot strings to BigInts (for use with Circom / Poseidon cipher).
 * @param {string[]} hexArray - array of 0x-prefixed hex strings
 * @returns {bigint[]}
 */
function toBigInts(hexArray) {
    return hexArray.map(x => BigInt(x));
}

/**
 * Get a unix timestamp (seconds) for use as a nonce.
 * @returns {bigint}
 */
function timeStamp() {
    return BigInt(Math.floor(Date.now() / 1000));
}

// --- CommonJS + ESM dual export ---
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { encodeAll, encodeSlot1, encodeSlot2, encodeSlot3, toBigInts, timeStamp };
}
export { encodeAll, encodeSlot1, encodeSlot2, encodeSlot3, toBigInts, timeStamp };
