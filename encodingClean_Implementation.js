// REVISED ENCODING SCHEME FOR CIRCOM (254-bit field):
// Slot 1: 15 position pairs (30 uint8 values) = 240 bits
// Slot 2: 3 position pairs (48 bits) + ruleset 1 (96 bits) + ruleset 2 (96 bits) = 240 bits
// Slot 3: 2 position pairs (32 bits) + ruleset 3 (96 bits) + ruleset 4 (96 bits) + 3 additional values (24 bits) = 248 bits

// Total capacity: 20 position pairs, 3 additional values, 4 rulesets
// All slots are under the 254-bit field limit for Circom

const positions = [
    { x: 13, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }, { x: 70, y: 80 }, { x: 90, y: 100 },
    { x: 110, y: 120 }, { x: 130, y: 140 }, { x: 150, y: 160 }, { x: 170, y: 180 }, { x: 190, y: 200 },
    { x: 210, y: 220 }, { x: 230, y: 240 }, { x: 250, y: 255 }, { x: 240, y: 230 }, { x: 220, y: 210 },
    { x: 200, y: 190 }, { x: 188, y: 170 }, { x: 160, y: 150 }, { x: 140, y: 130 }, { x: 120, y: 110 }
];

const additionalValues = [5, 10, 15];

const rulesets = [
    "ff0801000200000800ff0800",
    "ff0201ff0801000400000200",
    "ff0000ff0801000000000200",
    "ff0401000800ff0200000400"
];


function byteToHex(number) {
    return (number & 0xFF).toString(16).padStart(2, '0');
}

function hexToByte(hexString) {
    return parseInt(hexString, 16);
}


function decodePositionsInt(hexstring) {
    let numbers = [];
    //assert(hexstring.length % 2 === 0)
    for (let i = 0; i < hexstring.length; i = i + 4) {
        let bytePair1 = hexToByte(hexstring[i] + hexstring[i + 1])
        let bytePair2 = hexToByte(hexstring[i + 2] + hexstring[i + 3])
        numbers.push({ y: bytePair1, x: bytePair2 });
    }
    return numbers;
}

function encodePositionsHexString(positions) {
    let hexString = '';

    for (let i = 0; i < positions.length; i++) {
        const x = positions[i].x || 0;
        const y = positions[i].y || 0;

        // Ensure values are within uint8 range
        const safeX = Math.min(255, Math.max(0, x)) & 0xFF;
        const safeY = Math.min(255, Math.max(0, y)) & 0xFF;

        // Convert to hex and add to string (in little-endian order)
        const pairHex = byteToHex(safeY) + byteToHex(safeX);
        hexString = pairHex + hexString; // Prepend to maintain little-endian order
    }

    // Return as a hex string with '0x' prefix
    return hexString;
}

function decodeSlot2(hexString) {
    //console.log(hexString.substring(54, 67))
    var positions = decodePositionsInt(hexString.substring(54, 67)).reverse();
    var rules = [hexString.substring(30, 54), hexString.substring(6, 30)]
    return { positions: positions, rules: rules }
}


function encodeSlot2(rule1, rule2, posPairs) {
    //const hexPosPairs = posPairs.map((pos) => [byteToHex(pos.x), byteToHex(pos.y)]).flat(1)
    var thepositions = encodePositionsHexString(posPairs);
    // smol endian stuff
    var fullEncoding = rule2 + rule1 + thepositions;
    var fullPaddingHex = "0x" + String(fullEncoding).padStart(64, '0')
    return fullPaddingHex;
}


function decodeSlot1(hexString) {
    var positions = decodePositionsInt(hexString.substring(6, 67)).reverse();
    return { positions: positions }
}


function encodeSlot1(posPairs) {
    var thepositions = encodePositionsHexString(posPairs);
    var fullPaddingHex = "0x" + String(thepositions).padStart(64, '0');
    return fullPaddingHex
}

function decodeSlot3(hexString) {
    console.log(hexString.substring(58, 67))
    var positions = decodePositionsInt(hexString.substring(58, 67)).reverse();
    var rules = [hexString.substring(34, 58), hexString.substring(10, 34)]

    // Extract color from bits 248-251 (nibble after padding zeros)
    // In hex string 0x060f0a05..., color is at position 3
    var color = parseInt(hexString[3], 16);

    var additionalValues1 = {
        value3: hexToByte(hexString[4] + hexString[5]),
        value2: hexToByte(hexString[6] + hexString[7]),
        value1: hexToByte(hexString[8] + hexString[9])
    }
    console.log(additionalValues1)
    console.log("Color:", color)
    // hexToByte(hexString[4] + hexString[5])
    //console.log(additionalValues1)
    return { positions: positions, rules: rules, additionalValues: additionalValues1, color: color }
}

function encodeSlot3(rule3, rule4, posPairs, additionalValues, color) {
    // Validate color is between 1-16
    if (color < 1 || color > 16 || !Number.isInteger(color)) {
        throw new Error(`Color must be an integer between 1 and 16, got: ${color}`);
    }

    var thepositions = encodePositionsHexString(posPairs);
    // smol endian stuff
    // console.log(thepositions)
    var additionalValuesString = byteToHex(additionalValues[2]) + byteToHex(additionalValues[1]) + byteToHex(additionalValues[0])
    // console.log(additionalValuesString)

    // Encode color as a nibble (4 bits) at bits 248-251
    const colorHex = color.toString(16);

    var fullEncoding = colorHex + additionalValuesString + rule4 + rule3 + thepositions;
    var fullPaddingHex = "0x" + String(fullEncoding).padStart(64, '0');
    return fullPaddingHex;
}




//var test = encodeSlot1(positions.slice(0, 15))
// encodeSlot2(rulesets[0], rulesets[1], positions.slice(15, 18))
// encodeSlot3(rulesets[2], rulesets[3], positions.slice(18, 20), [5, 10, 15])



console.log("Encoding and decoding Slot1:")
console.log("encode Slot1:")
var hexString = encodeSlot1(positions.slice(0, 15));
console.log(hexString);
console.log("decode Slot1:")
var decoded1 = decodeSlot1(hexString);
console.log(decoded1);


console.log("Encoding and decoding Slot2:")
var hexString2 = encodeSlot2(rulesets[0], rulesets[1], positions.slice(15, 18))
console.log(hexString2)
console.log("decode Slot2:")
var decoded2 = decodeSlot2(hexString2);
console.log(decoded2);


console.log("Encoding and decoding Slot3:")
var hexString3 = encodeSlot3(rulesets[2], rulesets[3], positions.slice(18, 20), [5, 10, 15], 6) // color = 6
console.log(hexString3)
console.log("decode Slot3:")
var decoded3 = decodeSlot3(hexString3);
console.log(decoded3);


var allPositions = decoded1.positions.concat(decoded2.positions).concat(decoded3.positions)
// console.log(allPositions)
// console.log(positions)
var allRules = decoded2.rules.concat(decoded3.rules);
console.log(allRules)
console.log(rulesets)



