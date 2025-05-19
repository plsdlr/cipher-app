import { useState, useEffect } from 'react';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/contractAbi.ts';
import { useReadContract, useReadContracts } from 'wagmi';
import { useDecryptTurmite } from '../utils/useDecryptTurmite';

// flag == true -> Poseidon Cipher with own keypair
// flag == false -> Poseidon Cipher with ECDH with previos sender

// This is a proper custom hook that follows React's rules
export const useSendToken = () => {
    const [tokenToSend, setTokenToSend] = useState<string | null>(null);
    const [encryptedData, setEncryptedData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [decryptedDataState, setDecryptedDataState] = useState<any>(null);
    const [cipherFlag, setCipherFlag] = useState(false);

    // Only run the query if we have a tokenId to process
    const { data: encryptedNote, isLoading: isLoadingContract, error: contractError } = useReadContract({
        abi: EncryptedNFTABI,
        address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
        functionName: 'getEncryptedNote',
        args: tokenToSend ? [tokenToSend] : undefined,
        query: {
            enabled: !!tokenToSend
        }
    });

    const { data: lastAddress, isLoading: isLoadingContract1, error: contractError1 } = useReadContract({
        abi: EncryptedNFTABI,
        address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
        functionName: 'mapLastOwner',
        args: tokenToSend ? [tokenToSend] : undefined,
        query: {
            enabled: !!tokenToSend && !!encryptedNote && encryptedNote[5] === true // Check the flag here
        }
    });

    const { data: lastSenderPubKeys, isLoading: isLoadingContract2, error: contractError2 } = useReadContracts({
        contracts: [
            {
                abi: EncryptedNFTABI,
                address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
                functionName: 'userPublicKeys',
                args: [lastAddress, 0],
            },
            {
                abi: EncryptedNFTABI,
                address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
                functionName: 'userPublicKeys',
                args: [lastAddress, 1],
            },
        ],
        query: {
            enabled: !!lastAddress,
        }
    });


    // Format lastSenderPubKeys for the decryption hook
    const formattedPreviousSender = lastSenderPubKeys ?
        [lastSenderPubKeys[0]?.result, lastSenderPubKeys[1]?.result] as [bigint, bigint] :
        undefined;

    // The hook can handle undefined inputs - it will just set appropriate error states
    const {
        data: decryptedData,
        isLoading: isDecrypting,
        error: decryptError,
        usedEncryptionKey
    } = useDecryptTurmite(
        encryptedNote as [bigint, bigint, bigint, bigint, bigint] || undefined,
        encryptedNote?.[5] as boolean,
        formattedPreviousSender
    );



    // Process the encrypted note when it changes
    useEffect(() => {
        if (encryptedNote && !isLoadingContract) {
            console.log("✅ 1. Encrypted Note from blockchain:", encryptedNote);
            setEncryptedData(encryptedNote);
            console.log("Timestamp:");
            console.log(encryptedNote[4]);
            console.log("Flag:");
            console.log(encryptedNote[5]);
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