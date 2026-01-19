const {
    deriveSecretScalar } = require("@zk-kit/eddsa-poseidon");
const { poseidonEncrypt, poseidonDecrypt, poseidonDecryptWithoutCheck } = require("@zk-kit/poseidon-cipher")
const assert = require('node:assert');
const { Circomkit } = require("circomkit");
const { keyGeneration, generateEncryptionKey, genEcdhSharedKey, readJsonFromPath } = require("./cryptoUtils")

const { encodeSlot1, encodeSlot2, encodeSlot3 } = require('./encodingUtils.js');

async function initalizeCircomTransferCircuit() {

    const circomkit = new Circomkit({
        protocol: 'groth16',
        include: ["/home/p/dev-projects/circomKeyGen/node_modules/circomlib/circuits"]
    });

    await circomkit.compile('ecdh-poseidon-key-derivation-cipher-transfer', {
        file: 'ecdh-poseidon-cipher',
        template: 'EcdhPoseidonCipherKeyDerivationTransfer',
        params: [],
        pubs: [
            "newComputedCipherText",
            "oldComputedCipherText",
            "newReciverPublicKey",
            "newNonce",
            "myPublicKey"
        ]
    });

    return circomkit
}


async function initalizeCircomRecipherCircuit() {

    const circomkit = new Circomkit({
        protocol: 'groth16',
        include: ["/home/p/dev-projects/circomKeyGen/node_modules/circomlib/circuits"]
    });

    await circomkit.compile('add-new-data-encrypt-with-check', {
        file: 'verification-encoded-data',
        template: 'AddNewDataEncryptWithOptionalCheck',
        params: [],
        pubs: [
            "newComputedCipherText",
            "oldComputedCipherText",
            "newReciverPublicKey",
            "newNonce",
            "myPublicKey",
            "enableOneValueCheck"
        ]
    });

    return circomkit

}




async function main() {

    /////////////////////
    /// 1. the "Mint"///
    ////////////////////

    console.log("Start Minting Simulation")
    const positions = [
        { x: 13, y: 20 }, { x: 30, y: 40 }, { x: 50, y: 60 }, { x: 70, y: 80 }, { x: 90, y: 100 },
        { x: 110, y: 120 }, { x: 130, y: 140 }, { x: 150, y: 160 }, { x: 170, y: 180 }, { x: 190, y: 200 },
        { x: 210, y: 220 }, { x: 230, y: 240 }, { x: 250, y: 255 }, { x: 240, y: 230 }, { x: 220, y: 210 },
        { x: 200, y: 190 }, { x: 188, y: 170 }, { x: 160, y: 150 }, { x: 140, y: 130 }, { x: 120, y: 110 }
    ];

    const color = 7
    const PusherSlowness = 6;
    const CleanerSlowness = 1;
    const RectangleCount = 20;

    const additionalValues = [PusherSlowness, CleanerSlowness, RectangleCount];

    const rulesets = [
        "ff0801000200000800ff0800",
        "ff0201ff0801000400000200",
        "ff0000ff0801000000000200",
        "ff0401000800ff0200000400"
    ];

    var Slot1 = encodeSlot1(positions.slice(0, 15));
    var Slot2 = encodeSlot2(rulesets[0], rulesets[1], positions.slice(15, 18))
    var Slot3 = encodeSlot3(rulesets[2], rulesets[3], positions.slice(18, 20), additionalValues, color)


    const alice = keyGeneration();
    const bob = keyGeneration();
    const carol = keyGeneration();

    /// first mint package which is send
    const firstMessage = [Slot1, Slot2, Slot3].map(x => BigInt(x));

    /// preparing for mint - alice generates ecdh with herself
    const deriveSecretScalarPrivKey = deriveSecretScalar(alice[0]);
    var ecdhOld = genEcdhSharedKey(alice[0], alice[1]);
    var nonceOld = BigInt(5);
    const ciphertextFirstMessage = poseidonEncrypt(firstMessage, [ecdhOld[0], ecdhOld[1]], nonceOld);

    const inputMinting = {
        myPrivateKey: deriveSecretScalarPrivKey.toString(),
        oldSenderPublicKey: [alice[1][0].toString(), alice[1][1].toString()],
        newReciverPublicKey: [alice[1][0].toString(), alice[1][1].toString()],
        oldResultKey: [ecdhOld[0].toString(), ecdhOld[1].toString()],
        newResultKey: [ecdhOld[0].toString(), ecdhOld[1].toString()],
        oldMessage: firstMessage.map(x => x.toString()),
        newMessage: firstMessage.map(x => x.toString()),
        oldComputedCipherText: ciphertextFirstMessage.map(x => x.toString()),
        newComputedCipherText: ciphertextFirstMessage.map(x => x.toString()),
        oldNonce: nonceOld.toString(),
        newNonce: nonceOld.toString(),
        myPublicKey: [alice[1][0].toString(), alice[1][1].toString()],
        enableOneValueCheck: "0"
    };

    const reRipherCircuit = await initalizeCircomRecipherCircuit();
    console.log("reCipher Circuit Compiled")

    await reRipherCircuit.prove('add-new-data-encrypt-with-check', 'minting', inputMinting);
    console.log("PASSED: Minting Poof generated!\n");

    ////////////////////////
    /// 2. the "Transfer"///
    ///////////////////////

    console.log("Start Transfer Simulation")



    const transferCircuit = await initalizeCircomTransferCircuit();
    console.log("reCipher Circuit Compiled")

    // data has to stay the same at the transfer
    const secondMessage = firstMessage;



    var ecdhNew = genEcdhSharedKey(alice[0], bob[1]);

    var nonceNew = BigInt(6);

    var ciphertextSecondMessage = poseidonEncrypt(secondMessage, [
        ecdhNew[0], // x-coordinate
        ecdhNew[1]  // y-coordinate
    ], nonceNew)


    const inputTransfer = {
        myPrivateKey: deriveSecretScalarPrivKey.toString(),
        oldSenderPublicKey: [
            alice[1][0].toString(), // x-coordinate
            alice[1][1].toString()  // y-coordinate
        ],
        newReciverPublicKey: [
            bob[1][0].toString(), // x-coordinate
            bob[1][1].toString()  // y-coordinate
        ],
        oldResultKey: [
            ecdhOld[0].toString(), // x-coordinate
            ecdhOld[1].toString()  // y-coordinate
        ],
        newResultKey: [
            ecdhNew[0].toString(), // x-coordinate
            ecdhNew[1].toString()  // y-coordinate
        ],
        oldMessage: [
            firstMessage[0].toString(),
            firstMessage[1].toString(),
            firstMessage[2].toString()
        ],
        newMessage: [
            secondMessage[0].toString(),
            secondMessage[1].toString(),
            secondMessage[2].toString(),
        ],
        oldComputedCipherText: [
            ciphertextFirstMessage[0].toString(),
            ciphertextFirstMessage[1].toString(),
            ciphertextFirstMessage[2].toString(),
            ciphertextFirstMessage[3].toString()
        ],
        newComputedCipherText: [
            ciphertextSecondMessage[0].toString(),
            ciphertextSecondMessage[1].toString(),
            ciphertextSecondMessage[2].toString(),
            ciphertextSecondMessage[3].toString()
        ],
        oldNonce: nonceOld.toString(),
        newNonce: nonceNew.toString(),
        myPublicKey: [
            alice[1][0].toString(),
            alice[1][1].toString()
        ]

    };


    await transferCircuit.prove('ecdh-poseidon-key-derivation-cipher-transfer', 'transfer_with_recipherMint_before', inputTransfer);

    console.log("PASSED: Transfer Poof generated!\n");


    ////////////////////////
    /// 3. the "Recipher"///
    ///////////////////////

    ///bob changes the RectangleCount

    const newRectangleCount = 5;

    const newadditionalValues = [PusherSlowness, CleanerSlowness, newRectangleCount];

    Slot1 = encodeSlot1(positions.slice(0, 15));
    Slot2 = encodeSlot2(rulesets[0], rulesets[1], positions.slice(15, 18))
    Slot3 = encodeSlot3(rulesets[2], rulesets[3], positions.slice(18, 20), newadditionalValues, color)


    const thirdMessage = [Slot1, Slot2, Slot3].map(x => BigInt(x));

    /// preparing for recipher - bob generates ecdh with himself
    const deriveSecretScalarPrivKeyBob = deriveSecretScalar(bob[0]);

    /// bob generates the old key used for transfer
    ecdhOld = genEcdhSharedKey(bob[0], alice[1])
    //ecdhold = ecdhNew;

    /// bob generates the new key with himself
    ecdhNew = genEcdhSharedKey(bob[0], bob[1]);

    nonceOld = nonceNew;

    nonceNew = BigInt(7);

    ciphertextSecondMessage = poseidonEncrypt(secondMessage, [
        ecdhOld[0], // x-coordinate
        ecdhOld[1]  // y-coordinate
    ], nonceOld)


    var ciphertextThirdMessage = poseidonEncrypt(thirdMessage, [
        ecdhNew[0], // x-coordinate
        ecdhNew[1]  // y-coordinate
    ], nonceNew)



    const inputRecipher = {
        myPrivateKey: deriveSecretScalarPrivKeyBob.toString(),
        oldSenderPublicKey: [alice[1][0].toString(), alice[1][1].toString()],
        newReciverPublicKey: [bob[1][0].toString(), bob[1][1].toString()],
        oldResultKey: [ecdhOld[0].toString(), ecdhOld[1].toString()],
        newResultKey: [ecdhNew[0].toString(), ecdhNew[1].toString()],
        oldMessage: secondMessage.map(x => x.toString()),
        newMessage: thirdMessage.map(x => x.toString()),
        oldComputedCipherText: ciphertextSecondMessage.map(x => x.toString()),
        newComputedCipherText: ciphertextThirdMessage.map(x => x.toString()),
        oldNonce: nonceOld.toString(),
        newNonce: nonceNew.toString(),
        myPublicKey: [bob[1][0].toString(), bob[1][1].toString()],
        enableOneValueCheck: "1"
    };

    console.log("GET HERE")
    await reRipherCircuit.prove('add-new-data-encrypt-with-check', 'recipher', inputRecipher);
    console.log("PASSED: Recipher Poof generated!\n");


    //////////////////////////////////////////
    /// 3.1 the "transfer without recipher"///
    /////////////////////////////////////////

    ///bob sends to carrol without recipher


    // data has to stay the same at the transfer
    var thirdMessage_withoutRecipher = secondMessage;


    ecdhOld = genEcdhSharedKey(bob[0], alice[1]);

    ecdhNew = genEcdhSharedKey(bob[0], carol[1]);



    // var nonceNew = BigInt(6);

    var ciphertextSecondMessage = poseidonEncrypt(secondMessage, [
        ecdhOld[0], // x-coordinate
        ecdhOld[1]  // y-coordinate
    ], nonceOld)


    var ciphertextThirdMessage = poseidonEncrypt(thirdMessage_withoutRecipher, [
        ecdhNew[0], // x-coordinate
        ecdhNew[1]  // y-coordinate
    ], nonceNew)

    const input_transfer_withoutRecipher = {
        myPrivateKey: deriveSecretScalarPrivKeyBob.toString(),
        oldSenderPublicKey: [
            alice[1][0].toString(), // x-coordinate
            alice[1][1].toString()  // y-coordinate
        ],
        newReciverPublicKey: [
            carol[1][0].toString(), // x-coordinate
            carol[1][1].toString()  // y-coordinate
        ],
        oldResultKey: [
            ecdhOld[0].toString(), // x-coordinate
            ecdhOld[1].toString()  // y-coordinate
        ],
        newResultKey: [
            ecdhNew[0].toString(), // x-coordinate
            ecdhNew[1].toString()  // y-coordinate
        ],
        oldMessage: [
            secondMessage[0].toString(),
            secondMessage[1].toString(),
            secondMessage[2].toString(),
        ],
        newMessage: [
            thirdMessage_withoutRecipher[0].toString(),
            thirdMessage_withoutRecipher[1].toString(),
            thirdMessage_withoutRecipher[2].toString(),
        ],
        oldComputedCipherText: [
            ciphertextSecondMessage[0].toString(),
            ciphertextSecondMessage[1].toString(),
            ciphertextSecondMessage[2].toString(),
            ciphertextSecondMessage[3].toString()
        ],
        newComputedCipherText: [
            ciphertextThirdMessage[0].toString(),
            ciphertextThirdMessage[1].toString(),
            ciphertextThirdMessage[2].toString(),
            ciphertextThirdMessage[3].toString()
        ],
        oldNonce: nonceOld.toString(),
        newNonce: nonceNew.toString(),
        myPublicKey: [
            bob[1][0].toString(),
            bob[1][1].toString()
        ]

    };


    await transferCircuit.prove('ecdh-poseidon-key-derivation-cipher-transfer', 'transfer_without_recipher', input_transfer_withoutRecipher);

    console.log("transfer_without_recipher proof done")


}

main()

