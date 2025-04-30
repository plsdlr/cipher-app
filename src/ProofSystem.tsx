// TurmiteProofService.ts
//import * as snarkjs from 'snarkjs';
import * as snarkjs from 'snarkjs';

console.log("snarkjs structure:", Object.keys(snarkjs));
console.log("groth16 available?", snarkjs.groth16);

import { poseidonEncrypt } from "@zk-kit/poseidon-cipher";
import builder from './circuit_turmites/witness_calculator.js';

// Import your existing crypto utilities
import { generateEncryptionKey } from './cryptoUtils';

interface ProofResult {
    proof: any;
    publicSignals: any[];
    calldata: any;
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