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
    _privateKey: Uint8Array,
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
 * General ZK proof generation for AddNewDataEncryptWithOptionalCheck circuit
 * Used for both minting and recipher operations
 *
 * @param myPrivateKey Derived secret scalar from private key
 * @param oldSenderPublicKey Public key of the old sender (for verification)
 * @param newReciverPublicKey Public key of the new receiver
 * @param oldResultKey Old ECDH encryption key (2 elements)
 * @param newResultKey New ECDH encryption key (2 elements)
 * @param oldMessage Old message (3 slots)
 * @param newMessage New message (3 slots)
 * @param oldComputedCipherText Old computed ciphertext (4 elements)
 * @param newComputedCipherText New computed ciphertext (4 elements)
 * @param oldNonce Old nonce for encryption
 * @param newNonce New nonce for encryption
 * @param myPublicKey Current user's public key (2 elements)
 * @param enableOneValueCheck "0" for minting (no check), "1" for recipher (enables check)
 * @returns Promise resolving to proof result
 */
export async function generateProofTurmite(
    myPrivateKey: bigint,
    oldSenderPublicKey: bigint[],
    newReciverPublicKey: bigint[],
    oldResultKey: bigint[],
    newResultKey: bigint[],
    oldMessage: bigint[],
    newMessage: bigint[],
    oldComputedCipherText: bigint[],
    newComputedCipherText: bigint[],
    oldNonce: bigint,
    newNonce: bigint,
    myPublicKey: bigint[],
    enableOneValueCheck: "0" | "1"
): Promise<ProofResult> {

    try {
        // Prepare circuit input for AddNewDataEncryptWithOptionalCheck
        const input = {
            myPrivateKey: myPrivateKey,
            oldSenderPublicKey: [oldSenderPublicKey[0], oldSenderPublicKey[1]],
            newReciverPublicKey: [newReciverPublicKey[0], newReciverPublicKey[1]],
            oldResultKey: [oldResultKey[0], oldResultKey[1]],
            newResultKey: [newResultKey[0], newResultKey[1]],
            oldMessage: [oldMessage[0], oldMessage[1], oldMessage[2]],
            newMessage: [newMessage[0], newMessage[1], newMessage[2]],
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
            myPublicKey: [myPublicKey[0], myPublicKey[1]],
            enableOneValueCheck: enableOneValueCheck
        };

        // Use the circuit with optional check feature
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            '/circuit_turmites/add-new-data-encrypt-with-check.wasm',
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