import { useState, useEffect } from 'react';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import { decryptTurmiteData, DecryptedTurmiteData } from './decryptUtils';

interface UseDecryptTurmiteResult {
    data: DecryptedTurmiteData | null;
    isLoading: boolean;
    error: string | null;
    usedEncryptionKey: [bigint, bigint] | null;
    usedPublicKey: bigint[] | null | undefined;
}

/**
 * React hook for decrypting Turmite NFT data
 * 
 * @param encryptedData The encrypted data from the blockchain
 * @returns Object containing decrypted data, loading state, and error if any
 */
export const useDecryptTurmite = (
    encryptedData: [bigint, bigint, bigint, bigint, bigint] | null | undefined,
    encryptionFlag: boolean | null | undefined,
    previosSender: [bigint, bigint] | null | undefined
): UseDecryptTurmiteResult => {
    const { privateKey, generateEncryptionKey, genEcdhSharedKey, publicKey } = useWallet();
    const [state, setState] = useState<UseDecryptTurmiteResult>({
        data: null,
        isLoading: true,
        error: null,
        usedEncryptionKey: null,
        usedPublicKey: null
    });

    useEffect(() => {
        // Reset state when encrypted data changes
        setState({
            data: null,
            isLoading: true,
            error: null,
            usedEncryptionKey: null,
            usedPublicKey: null
        });

        const decrypt = async () => {
            // Check if we have the necessary data
            if (!privateKey || !encryptedData) {
                setState({
                    data: null,
                    isLoading: false,
                    error: !encryptedData
                        ? "No encrypted data provided"
                        : !privateKey
                            ? "Wallet not initialized or unlocked"
                            : null,
                    usedEncryptionKey: null,
                    usedPublicKey: null
                });
                return;
            }

            try {
                var encryptionKey;
                var usedPublicKey;
                if (encryptionFlag == true) {
                    encryptionKey = generateEncryptionKey();
                    usedPublicKey = publicKey
                } else if (encryptionFlag == false && previosSender) {
                    encryptionKey = genEcdhSharedKey([previosSender[0], previosSender[1]])
                    usedPublicKey = [previosSender[0], previosSender[1]]
                }
                if (!encryptionKey) {
                    throw new Error("Failed to generate encryption key");
                }

                // Decrypt the data
                const decryptedData = await decryptTurmiteData(encryptedData, encryptionKey);

                // Update state with decrypted data
                setState({
                    data: decryptedData,
                    isLoading: false,
                    error: null,
                    usedEncryptionKey: encryptionKey,
                    usedPublicKey: usedPublicKey
                });
            } catch (err) {
                console.error('Hook decryption error:', err);
                setState({
                    data: null,
                    isLoading: false,
                    error: (err as Error).message || "Unknown decryption error",
                    usedEncryptionKey: null,
                    usedPublicKey: null
                });
            }
        };

        decrypt();
    }, [encryptedData, privateKey]);

    return state;
};