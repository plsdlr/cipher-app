#!/usr/bin/env node

// ============================================================
// Random Turmite Seed Generator
// Generates a config object that can be passed directly into
// indexTurmite_deterministic.html via postMessage.
//
// Usage:
//   node generateRandomSeed.js              # print JSON config
//   node generateRandomSeed.js --count 5    # generate 5 configs
//   node generateRandomSeed.js --pretty     # pretty-print JSON
//
// The output can be used with:
//   iframe.contentWindow.postMessage({
//     type: 'UPDATE_ANIMATION',
//     data: <output of this script>
//   }, '*');
// ============================================================

// --- Gene pools (same as Mint.tsx) ---

const BUILDER_GENES = [
    { rule: "ff0201ff0201ff0000ff0001", name: "Trails" },
    { rule: "ff0801000200000800ff0800", name: "Ornament" },
    { rule: "ff0201000201ff0400000000", name: "Cave" },
    { rule: "ff0201000801ff0000000000", name: "Cross" },
    { rule: "ff0201ff0000ff0000000800", name: "Crystal" },
    { rule: "ff0201000800ff0000000801", name: "Motion" },
    { rule: "ff0001000001ff0801000000", name: "Twisted" },
    { rule: "ff0001000201ff0000000800", name: "Swift" },
    { rule: "ff0201ff0800000000000801", name: "Lamp" },
    { rule: "ff0200000801ff0800000201", name: "Guwoz" },
    { rule: "ff0800ff0201000200000801", name: "Crown" },
    { rule: "ff0201ff0000000200ff0400", name: "Snow" },
    { rule: "ff0801ff0200000200ff0001", name: "Wolf (r)" },
    { rule: "ff0201ff0201ff0400000000", name: "Vermin" },
    { rule: "ff0400000401ff0200ff0801", name: "Ibis" }
];

const WALKER_GENES = [
    { rule: "ff0000ff0801000000000200", name: "Paragon" },
    { rule: "ff0801ff0200000200ff0001", name: "Aurora (r)" },
    { rule: "ff0001ff0800000000ff0001", name: "Peregrine (r)" },
    { rule: "ff0000ff0801ff0400000200", name: "Flock" },
    { rule: "ff0801ff0200000200ff0001", name: "Wolf (r)" },
    { rule: "ff0001000801ff0000ff0200", name: "Ant" },
    { rule: "ff0001ff0201ff0000ff0800", name: "Epitome" },
    { rule: "ff0400000401ff0200ff0801", name: "Vermicular" },
    { rule: "ff0200000001000000ff0801", name: "terra" }
];

// --- Valid animation parameter combinations ---
// Only these (pusher, cleaner, rectangleCount) triples are allowed.

const VALID_COMBINATIONS = {
    6:  { 1: [20, 30], 2: [5] },
    11: { 1: [20, 25, 30], 2: [5, 20, 25, 30], 3: [5] },
    15: { 1: [5, 20, 25, 30], 2: [5, 20, 25], 3: [5], 4: [5, 20] },
    25: { 1: [5, 30], 2: [5, 25], 3: [5], 4: [5] }
};

// Flatten into a list of valid triples for easy random picking
const VALID_TRIPLES = [];
for (const [pusher, cleanerMap] of Object.entries(VALID_COMBINATIONS)) {
    for (const [cleaner, rects] of Object.entries(cleanerMap)) {
        for (const rect of rects) {
            VALID_TRIPLES.push({
                pusherFrames: Number(pusher),
                cleanerFrames: Number(cleaner),
                rectangleCount: rect
            });
        }
    }
}

// --- Helpers ---

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// --- Generator ---

function generateRandomConfig() {
    // 1. 20 random coordinate pairs, x and y in [0, 256]
    const coordinates = Array.from({ length: 20 }, () => ({
        x: randomInt(0, 256),
        y: randomInt(0, 256)
    }));

    // 2. Pick 3 builder genes (with replacement)
    const builders = Array.from({ length: 3 }, () => randomPick(BUILDER_GENES));

    // 3. Pick 1 walker gene
    const walker = randomPick(WALKER_GENES);

    // 4. Pick a valid animation parameter triple
    const animParams = randomPick(VALID_TRIPLES);

    // 5. Pick a color (0-15)
    const color = randomInt(0, 15);

    // Build the config object in the exact shape indexTurmite_deterministic.html expects
    return {
        coordinates,
        speed: 1,
        builderTurmites: builders.map(g => g.rule),
        walkerTurmites: [walker.rule],
        chaosNumbers: [
            animParams.pusherFrames,
            animParams.cleanerFrames,
            animParams.rectangleCount
        ],
        color,
        // Metadata (not consumed by the HTML, but useful for logging)
        _meta: {
            builderNames: builders.map(g => g.name),
            walkerName: walker.name,
            pusherFrames: animParams.pusherFrames,
            cleanerFrames: animParams.cleanerFrames,
            rectangleCount: animParams.rectangleCount,
            colorIndex: color
        }
    };
}

// --- CLI ---

function main() {
    const args = process.argv.slice(2);
    const pretty = args.includes('--pretty');
    const countIdx = args.indexOf('--count');
    const count = countIdx !== -1 ? parseInt(args[countIdx + 1], 10) || 1 : 1;

    const configs = Array.from({ length: count }, () => generateRandomConfig());

    if (count === 1) {
        console.log(JSON.stringify(configs[0], null, pretty ? 2 : 0));
    } else {
        console.log(JSON.stringify(configs, null, pretty ? 2 : 0));
    }
}

// Also export for use as a module
export { generateRandomConfig, BUILDER_GENES, WALKER_GENES, VALID_COMBINATIONS, VALID_TRIPLES };

main();
