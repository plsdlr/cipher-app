import { useState, useEffect } from 'react';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import { decryptTurmiteData, DecryptedTurmiteData } from './decryptUtils';

interface UseDecryptTurmiteResult {
    data: DecryptedTurmiteData | null;
    isLoading: boolean;
    error: string | null;
}

/**
 * React hook for decrypting Turmite NFT data
 * 
 * @param encryptedData The encrypted data from the blockchain
 * @returns Object containing decrypted data, loading state, and error if any
 */
export const useDecryptTurmite = (
    encryptedData: [bigint, bigint, bigint, bigint, bigint] | null | undefined
): UseDecryptTurmiteResult => {
    const { isGenerated, privateKey, generateEncryptionKey } = useWallet();
    const [state, setState] = useState<UseDecryptTurmiteResult>({
        data: null,
        isLoading: true,
        error: null
    });

    useEffect(() => {
        // Reset state when encrypted data changes
        setState({
            data: null,
            isLoading: true,
            error: null
        });

        const decrypt = async () => {
            // Check if we have the necessary data
            if (!isGenerated || !privateKey || !encryptedData) {
                setState({
                    data: null,
                    isLoading: false,
                    error: !encryptedData
                        ? "No encrypted data provided"
                        : !isGenerated || !privateKey
                            ? "Wallet not initialized or unlocked"
                            : null
                });
                return;
            }

            try {
                // Get the encryption key
                const encryptionKey = generateEncryptionKey();
                if (!encryptionKey) {
                    throw new Error("Failed to generate encryption key");
                }

                // Decrypt the data
                const decryptedData = await decryptTurmiteData(encryptedData, encryptionKey);

                // Update state with decrypted data
                setState({
                    data: decryptedData,
                    isLoading: false,
                    error: null
                });
            } catch (err) {
                console.error('Hook decryption error:', err);
                setState({
                    data: null,
                    isLoading: false,
                    error: err.message || "Unknown decryption error"
                });
            }
        };

        decrypt();
    }, [encryptedData, isGenerated, privateKey]);

    return state;
};