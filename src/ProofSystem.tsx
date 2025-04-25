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
    ciphertext: any;
}

// Cache for proofs
// const proofCache = new Map<string, ProofResult>();

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
    // Create a cache key
    // const cacheKey = JSON.stringify({
    //     privateKey: Array.from(privateKey),
    //     publicKey: [publicKey[0].toString(), publicKey[1].toString()],
    //     turmiteSlots,
    //     nonce: nonce.toString()
    // });

    // // Check cache
    // if (proofCache.has(cacheKey)) {
    //     return proofCache.get(cacheKey)!;
    // }

    try {

        console.log("ALL LOGS______>>>")
        console.log("turmiteSlots:", turmiteSlots);
        console.log("deriveSecretScalarPrivKey:", deriveSecretScalarPrivKey);
        console.log("publicKey:", publicKey);
        console.log("encryptionKey:", encryptionKey);
        console.log("nonce:", nonce);
        console.log("ciphertext:", ciphertext);



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

        // Load WASM for the circuit
        //const wasmResponse = await fetch('./circuit_tumrites/verification-encoded-data-add.wasm');
        //const wasmResponse = await fetch('/circuit_turmites/verification-encoded-data-add.wasm');
        // const wasmResponse = await fetch(wasmUrl);
        //const wasmBuffer = await wasmResponse.arrayBuffer();
        console.log("get here")


        // Use fullProve which handles witness calculation internally
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            '/circuit_turmites/verification-encoded-data-add.wasm',
            '/circuit_turmites/groth16_pkey.zkey'
        );

        console.log("Proof generated successfully:", proof);


        // // // Create witness calculator
        // const witnessCalculator = await builder(wasmBuffer);

        // // // Calculate witness
        // const witness = await witnessCalculator.calculateWitness(input);
        // console.log("witness calc done")

        // const zkeyResponse = await fetch('/circuit_turmites/groth16_pkey.zkey');
        // const zkeyBuffer = await zkeyResponse.arrayBuffer();

        // // Convert the buffer to a Uint8Array
        // const zkeyData = new Uint8Array(zkeyBuffer);

        // const zkeyCheck = await fetch('/circuit_turmites/groth16_pkey.zkey');
        // if (!zkeyCheck.ok) {
        //     console.error(`Failed to load zkey file: ${zkeyCheck.status} ${zkeyCheck.statusText}`);
        //     throw new Error(`Failed to load zkey file: ${zkeyCheck.status}`);
        // }
        // const zkeyResponse = await fetch('/circuit_turmites/groth16_pkey.zkey');

        // // Check if the fetch succeeded
        // if (!zkeyResponse.ok) {
        //     throw new Error(`Failed to fetch zkey: ${zkeyResponse.status} ${zkeyResponse.statusText}`);
        // }

        // const zkeyBuffer = await zkeyResponse.arrayBuffer();

        // // Create a temporary blob URL for the zkey
        // const zkeyBlob = new Blob([zkeyBuffer]);
        // const zkeyUrl = URL.createObjectURL(zkeyBlob);

        // // Similarly for witness if needed
        // const witnessBlob = new Blob([witness]);
        // const witnessUrl = URL.createObjectURL(witnessBlob);

        // const { proof, publicSignals } = await snarkjs.groth16.prove(
        //     zkeyUrl,
        //     witnessUrl
        // );

        // console.log("Proof generated:", proof);



        return result;
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