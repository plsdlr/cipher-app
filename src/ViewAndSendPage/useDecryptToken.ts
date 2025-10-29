import { useState, useEffect } from 'react';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi.ts';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { useDecryptTurmite } from '../utils/useDecryptTurmite';

interface DecryptedTokenData {
    tokenId: string;
    encryptedNote: [bigint, bigint, bigint, bigint, bigint, boolean];
    decryptedData: any;
    usedEncryptionKey: [bigint, bigint] | null;
    cipherFlag: boolean;
    lastOwnerAddress?: string;
    lastOwnerPubKeys?: bigint[];
}

interface UseDecryptTokenResult {
    data: DecryptedTokenData | null;
    isLoading: boolean;
    error: string | null;
}

// flag == true -> Poseidon Cipher with own keypair
// flag == false -> Poseidon Cipher with ECDH with previous sender

export const useDecryptToken = (tokenId: string | null): UseDecryptTokenResult => {
    const account = useAccount();

    // Step 1: Get encrypted note
    const { data: encryptedNote, isLoading: isLoadingContract, error: contractError } = useReadContract({
        abi: EncryptedNFTABI,
        address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
        functionName: 'getEncryptedNote',
        args: tokenId ? [tokenId] : undefined,
        query: {
            enabled: !!tokenId
        }
    });

    // Extract flag from encrypted note
    const cipherFlag = encryptedNote?.[5] as boolean;
    const hasEncryptedNote = !!encryptedNote && cipherFlag !== undefined;

    // Step 2: Get last owner address (only if flag is false - meaning we need ECDH)
    const { data: lastAddress, isLoading: isLoadingLastOwner, error: contractError1 } = useReadContract({
        abi: EncryptedNFTABI,
        address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
        functionName: 'mapLastOwner',
        args: tokenId ? [tokenId] : undefined,
        query: {
            enabled: !!tokenId && hasEncryptedNote && cipherFlag === false
        }
    });

    // Step 3: Get last owner's public keys (only if we have the address and flag is false)
    const { data: lastSenderPubKeys, isLoading: isLoadingPubKeys, error: contractError2 } = useReadContracts({
        contracts: [
            {
                abi: EncryptedNFTABI,
                address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
                functionName: 'userPublicKeys',
                args: lastAddress ? [lastAddress, 0] : undefined,
            },
            {
                abi: EncryptedNFTABI,
                address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
                functionName: 'userPublicKeys',
                args: lastAddress ? [lastAddress, 1] : undefined,
            },
        ],
        query: {
            enabled: !!lastAddress && cipherFlag === false
        }
    });

    // Format public keys for the decryption hook
    const formattedPreviousSender = lastSenderPubKeys &&
        lastSenderPubKeys[0]?.result !== undefined &&
        lastSenderPubKeys[1]?.result !== undefined ?
        [lastSenderPubKeys[0].result, lastSenderPubKeys[1].result] as [bigint, bigint] :
        undefined;

    // Determine if we're ready to decrypt
    const readyToDecrypt = hasEncryptedNote && (
        cipherFlag === true || // Own keypair - don't need previous sender
        (cipherFlag === false && formattedPreviousSender !== undefined) // ECDH - need previous sender
    );

    // Step 4: Decrypt the data - only when we have all required data
    const {
        data: decryptedData,
        isLoading: isDecrypting,
        error: decryptError,
        usedEncryptionKey,
        usedPublicKey
    } = useDecryptTurmite(
        readyToDecrypt ? encryptedNote as [bigint, bigint, bigint, bigint, bigint] : undefined,
        cipherFlag,
        formattedPreviousSender
    );

    // Combine loading states
    const isLoading = isLoadingContract ||
        (cipherFlag === false && (isLoadingLastOwner || isLoadingPubKeys)) ||
        isDecrypting;

    // Combine errors
    const error = contractError?.message ||
        contractError1?.message ||
        contractError2?.message ||
        decryptError;

    // Determine the owner address to return
    const ownerAddress = cipherFlag === false ? lastAddress : account.address;

    // Build final result
    const data: DecryptedTokenData | null = tokenId && hasEncryptedNote && decryptedData ? {
        tokenId,
        encryptedNote: [...encryptedNote.slice(0, 5), cipherFlag] as [bigint, bigint, bigint, bigint, bigint, boolean],
        decryptedData,
        usedEncryptionKey,
        cipherFlag,
        lastOwnerAddress: ownerAddress,
        lastOwnerPubKeys: usedPublicKey || []
    } : null;

    // Debug logging
    useEffect(() => {
        if (tokenId) {
            console.log('useDecryptToken Debug:', {
                tokenId,
                hasEncryptedNote,
                cipherFlag,
                readyToDecrypt,
                isLoading,
                error,
                lastAddress,
                formattedPreviousSender,
                decryptedData: !!decryptedData
            });
        }
    }, [tokenId, hasEncryptedNote, cipherFlag, readyToDecrypt, isLoading, error, lastAddress, formattedPreviousSender, decryptedData]);

    return {
        data,
        isLoading,
        error
    };
};


