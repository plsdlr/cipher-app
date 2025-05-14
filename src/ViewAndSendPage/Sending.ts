import { useState, useEffect } from 'react';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/contractAbi.ts';
import { useReadContract } from 'wagmi';
import { useDecryptTurmite } from '../utils/useDecryptTurmite';

// This is a proper custom hook that follows React's rules
export const useSendToken = () => {
    const [tokenToSend, setTokenToSend] = useState<string | null>(null);
    const [encryptedData, setEncryptedData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [decryptedDataState, setDecryptedDataState] = useState<any>(null);

    // Only run the query if we have a tokenId to process
    const { data: encryptedNote, isLoading: isLoadingContract, error: contractError } = useReadContract({
        abi: EncryptedNFTABI,
        address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
        functionName: 'getEncryptedNote',
        args: tokenToSend ? [tokenToSend] : undefined,
        enabled: !!tokenToSend // Only run the query if tokenToSend exists
    });

    const {
        data: decryptedData,
        isLoading: isDecrypting,
        error: decryptError
    } = useDecryptTurmite(
        encryptedNote as [bigint, bigint, bigint, bigint, bigint] || undefined
    );


    // Process the encrypted note when it changes
    useEffect(() => {
        if (encryptedNote && !isLoadingContract) {
            console.log("✅ 1. Encrypted Note from blockchain:", encryptedNote);
            setEncryptedData(encryptedNote);
        }
        if (decryptedData && !isDecrypting) {
            console.log("✅ 2. Decryption complete:", decryptedData);
            setDecryptedDataState(decryptedData);
            // This is available for our UI and sending logic now

            // We could store this in state if we needed additional processing, but
            // we now just pass it directly back to components via the hook's return value
        }

    }, [encryptedNote, isLoadingContract, decryptedData, isDecrypting]);

    // This is the function you'll call from your component
    const prepareTokenSend = (tokenId: string) => {
        if (!tokenId) return;

        setTokenToSend(tokenId);
        setIsLoading(true);
        setError(null);

        console.log(`Preparing to send token: ${tokenId}`);
    };

    // Optional: function to actually send the token
    const sendToken = async (receiverAddress: string) => {
        if (!tokenToSend || !encryptedData) {
            setError("No token selected or data not loaded");
            return;
        }

        try {
            console.log(`Would send token ${tokenToSend} to ${receiverAddress}`);
            console.log(`With encrypted data:`, encryptedData);

            // Your actual send logic would go here
            // e.g. await writeContract({...})

            // Reset after sending
            setTokenToSend(null);
            setEncryptedData(null);
        } catch (err) {
            setError(err.message || "Error sending token");
        } finally {
            setIsLoading(false);
        }
    };

    // Return values and functions to be used in your component
    return {
        tokenToSend,
        encryptedData,
        isLoading: isLoading || isLoadingContract,
        error: error || (contractError ? contractError.message : null),
        prepareTokenSend,
        sendToken
    };
};