import { poseidonDecrypt } from '@zk-kit/poseidon-cipher';
import { decodeSlot1_withPadding, decodeSlot2_withPadding, decodeSlot3_withPadding } from './encodingUtils';

// Define types
export type EncryptionKey = [bigint, bigint];
export type DecryptedTurmiteData = {
    positions: { x: number, y: number }[];
    rules: string[];
    additionalValues: number[];
    rawDecryption?: bigint[];
};

/**
 * Decrypts encrypted turmite data from the blockchain
 * 
 * @param encryptedData The encrypted data array from the smart contract [ciphertext0, ciphertext1, ciphertext2, ciphertext3, timestamp]
 * @param encryptionKey The encryption key from the wallet
 * @returns DecryptedTurmiteData containing positions, rules, and additionalValues
 * @throws Error if decryption fails
 */
export const decryptTurmiteData = async (
    encryptedData: [bigint, bigint, bigint, bigint, bigint],
    encryptionKey: EncryptionKey
): Promise<DecryptedTurmiteData> => {
    if (!encryptedData || !encryptionKey) {
        throw new Error("Missing encrypted data or encryption key");
    }

    try {
        // Extract timestamp and ciphertext
        const [ciphertext0, ciphertext1, ciphertext2, ciphertext3, timestamp] = encryptedData;

        // Decrypt the data using poseidon cipher
        const decrypted = poseidonDecrypt(
            [ciphertext0, ciphertext1, ciphertext2, ciphertext3],
            encryptionKey,
            timestamp,
            3 // Number of slots
        );

        // Decode the slots
        const slot1 = decodeSlot1_withPadding(decrypted[0]);
        const slot2 = decodeSlot2_withPadding(decrypted[1]);
        const slot3 = decodeSlot3_withPadding(decrypted[2]);

        // Combine data from all slots
        const allPositions = slot1.positions.concat(slot2.positions).concat(slot3.positions);
        const allRules = slot2.rules.concat(slot3.rules);
        const additionalValues = [
            slot3.additionalValues.value1,
            slot3.additionalValues.value2,
            slot3.additionalValues.value3
        ];

        return {
            positions: allPositions,
            rules: allRules,
            additionalValues: additionalValues,
            rawDecryption: decrypted
        };
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error(`Failed to decrypt data: ${error.message}`);
    }
};

/**
 * Helper function to check if an encryption key is valid
 * 
 * @param key The encryption key to validate
 * @returns boolean indicating if the key is valid
 */
export const isValidEncryptionKey = (key: any): boolean => {
    return (
        Array.isArray(key) &&
        key.length === 2 &&
        typeof key[0] === 'bigint' &&
        typeof key[1] === 'bigint'
    );
};
