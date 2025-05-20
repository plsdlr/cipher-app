import { useState, useEffect } from 'react';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/contractAbi.ts';
import { useReadContract, useReadContracts, useAccount } from 'wagmi';
import { useDecryptTurmite } from '../utils/useDecryptTurmite';

interface DecryptedTokenData {
    tokenId: string;
    encryptedNote: [bigint, bigint, bigint, bigint, bigint, boolean];
    decryptedData: any;
    usedEncryptionKey: [bigint, bigint] | null;
    cipherFlag: boolean;
    lastOwnerAddress?: string;
    lastOwnerPubKeys?: [bigint, bigint];
}

interface UseDecryptTokenResult {
    data: DecryptedTokenData | null;
    isLoading: boolean;
    error: string | null;
}

// flag == true -> Poseidon Cipher with own keypair
// flag == false -> Poseidon Cipher with ECDH with previous sender

export const useDecryptToken = (tokenId: string | null): UseDecryptTokenResult => {
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


    // Step 2: Get last owner address (only if flag is false - meaning we need ECDH)
    const { data: lastAddress, isLoading: isLoadingContract1, error: contractError1 } = useReadContract({
        abi: EncryptedNFTABI,
        address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
        functionName: 'mapLastOwner',
        args: tokenId ? [tokenId] : undefined,
        query: {
            enabled: !!tokenId && !!encryptedNote && cipherFlag === false
        }
    });

    // Step 3: Get last owner's public keys (only if we have the address)
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
            enabled: !!lastAddress
        }
    });

    // Format public keys for the decryption hook
    const formattedPreviousSender = lastSenderPubKeys ?
        [lastSenderPubKeys[0]?.result, lastSenderPubKeys[1]?.result] as [bigint, bigint] :
        undefined;

    // fallback eth address if flag is true
    const account = useAccount();
    const address = account.address;

    // when we dont get lastSender we fill in undefined and the hook handles it because of the flag

    // Step 4: Decrypt the data
    const {
        data: decryptedData,
        isLoading: isDecrypting,
        error: decryptError,
        usedEncryptionKey,
        usedPublicKey
    } = useDecryptTurmite(
        encryptedNote as [bigint, bigint, bigint, bigint, bigint] || undefined,
        cipherFlag,
        formattedPreviousSender
    );

    // Combine everything into final result
    const isLoading = isLoadingContract || isLoadingContract1 || isLoadingContract2 || isDecrypting;
    const error = contractError?.message || contractError1?.message || contractError2?.message || decryptError;

    // console.log(usedPublicKey);

    const data: DecryptedTokenData | null =
        tokenId && encryptedNote && decryptedData ? {
            tokenId,
            encryptedNote: [...encryptedNote.slice(0, 5), cipherFlag] as [bigint, bigint, bigint, bigint, bigint, boolean],
            decryptedData,
            usedEncryptionKey,
            cipherFlag,
            lastOwnerAddress: lastAddress || address,
            lastOwnerPubKeys: usedPublicKey
        } : null;

    return {
        data,
        isLoading,
        error
    };
};