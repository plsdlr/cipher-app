// TurmiteProofService.ts
//import * as snarkjs from 'snarkjs';
import * as snarkjs from 'snarkjs';

console.log("snarkjs structure:", Object.keys(snarkjs));
console.log("groth16 available?", snarkjs.groth16);

export interface ProofCalldata {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    publivInput: string[];
}

interface ProofResult {
    proof: any;
    publicSignals: any[];
    calldata: ProofCalldata;
}

export async function generateProofTransfer(
    privateKey: Uint8Array,
    deriveSecretScalarPrivKey: bigint,
    myPublicKey: bigint[],
    previosSenderPublicKey: bigint[],
    nextReciverPublicKey: bigint[],
    oldEncryptionKey: bigint[],
    newEncryptionKey: bigint[],
    oldMessage: bigint[],
    newMessage: bigint[],
    oldComputedCipherText: bigint[],
    newComputedCipherText: bigint[],
    oldNonce: bigint[],
    newNonce: bigint[]
): Promise<ProofResult> {

    const input = {
        myPrivateKey: deriveSecretScalarPrivKey,
        oldSenderPublicKey: [
            previosSenderPublicKey[0], // x-coordinate
            previosSenderPublicKey[1] // y-coordinate
        ],
        newReciverPublicKey: [
            nextReciverPublicKey[0], // x-coordinate
            nextReciverPublicKey[1] // y-coordinate
        ],
        oldResultKey: [
            oldEncryptionKey[0], // x-coordinate
            oldEncryptionKey[1]  // y-coordinate
        ],
        newResultKey: [
            newEncryptionKey[0], // x-coordinate
            newEncryptionKey[1]  // y-coordinate
        ],
        oldMessage: [
            oldMessage[0],
            oldMessage[1],
            oldMessage[2]
        ],
        newMessage: [
            newMessage[0],
            newMessage[1],
            newMessage[2],
        ],
        oldComputedCipherText: [
            oldComputedCipherText[0],
            oldComputedCipherText[1],
            oldComputedCipherText[2],
            oldComputedCipherText[3]
        ],
        newComputedCipherText: [
            newComputedCipherText[0],
            newComputedCipherText[1],
            newComputedCipherText[2],
            newComputedCipherText[3]
        ],
        oldNonce: oldNonce,
        newNonce: newNonce,
        myPublicKey: [
            myPublicKey[0],
            myPublicKey[1]
        ]
    };


    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        input,
        '/circuit_transfer/ecdh-poseidon-key-derivation-cipher-transfer.wasm',
        '/circuit_transfer/groth16_pkey.zkey'
    );



    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

    const jsonString = `[${calldata}]`;

    const parsed = JSON.parse(jsonString);
    const strucuredCalldata = {
        a: parsed[0],        // a points (2 elements)
        b: parsed[1],        // b points (2x2 elements)
        c: parsed[2],        // c points (2 elements)
        publivInput: parsed[3]     // public inputs (variable length)
    }



    return { proof: proof, publicSignals: publicSignals, calldata: strucuredCalldata };



}

/**
 * Generates a ZK proof for turmite data
 * 
 * @param privateKey The private key as Uint8Array
 * @param publicKey The public key as [BigInt, BigInt]
 * @param turmiteSlots Array of turmite slot data as hex strings
 * @param nonce BigInt nonce for encryption (default: 5n)
 * @returns Promise resolving to proof result
 */
export async function generateProofTurmite(
    privateKey: Uint8Array,
    publicKey: bigint[],
    turmiteSlots: bigint[],
    deriveSecretScalarPrivKey: bigint,
    ciphertext: bigint[],
    encryptionKey: bigint[],
    nonce: bigint[]
): Promise<ProofResult> {

    try {

        // console.log("ALL LOGS______>>>")
        // console.log("turmiteSlots:", turmiteSlots);
        // console.log("deriveSecretScalarPrivKey:", deriveSecretScalarPrivKey);
        // console.log("publicKey:", publicKey);
        // console.log("encryptionKey:", encryptionKey);
        // console.log("nonce:", nonce);
        // console.log("ciphertext:", ciphertext);



        // Prepare circuit input
        const input = {
            slot1: turmiteSlots[0],
            slot2: turmiteSlots[1],
            slot3: turmiteSlots[2],
            myPrivateKey: deriveSecretScalarPrivKey,
            myPublicKey: [
                publicKey[0],
                publicKey[1]
            ],
            resultKey: [encryptionKey[0], encryptionKey[1]],
            nonce: nonce,
            computedCipherText: ciphertext
        };

        // console.log("get here")


        // Use fullProve which handles witness calculation internally
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            '/circuit_turmites/verification-encoded-data-add.wasm',
            '/circuit_turmites/groth16_pkey.zkey'
        );

        const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);

        const jsonString = `[${calldata}]`;

        const parsed = JSON.parse(jsonString);

        const strucuredCalldata = {
            a: parsed[0],        // a points (2 elements)
            b: parsed[1],        // b points (2x2 elements)
            c: parsed[2],        // c points (2 elements)
            publivInput: parsed[3]     // public inputs (variable length)
        }

        // console.log("Proof generated successfully:", proof);



        return { proof: proof, publicSignals: publicSignals, calldata: strucuredCalldata };
    } catch (err: any) {
        throw new Error(`Error generating proof: ${err.message}`);
    }
}

/**
 * Verifies a previously generated ZK proof
 * 
 * @param proof The proof object
 * @param publicSignals The public signals array
 * @returns Promise resolving to boolean verification result
 */
export async function verifyProofTurmite(
    proof: any,
    publicSignals: any[]
): Promise<boolean> {
    try {
        // Load verification key
        const vkeyResponse = await fetch('/circuits/verification_key.json');
        const vkey = await vkeyResponse.json();

        // Verify the proof
        const verified = await snarkjs.groth16.verify(vkey, publicSignals, proof);

        return verified;
    } catch (err: any) {
        throw new Error(`Error verifying proof: ${err.message}`);
    }
}