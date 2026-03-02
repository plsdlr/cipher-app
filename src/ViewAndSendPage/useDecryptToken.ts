import { useMemo } from 'react';
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
    // Contract returns (uint256[] ciphertext, uint256 timestamp, bool flag)
    const cipherFlag = (encryptedNote as any)?.[2] as boolean;
    const hasEncryptedNote = !!encryptedNote && (encryptedNote as any)[2] !== undefined;

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

    // Format public keys for the decryption hook - memoized to prevent new array reference each render
    const formattedPreviousSender = useMemo(() => {
        if (!lastSenderPubKeys ||
            lastSenderPubKeys[0]?.result === undefined ||
            lastSenderPubKeys[1]?.result === undefined) return undefined;
        return [lastSenderPubKeys[0].result, lastSenderPubKeys[1].result] as [bigint, bigint];
    }, [lastSenderPubKeys]);

    // Determine if we're ready to decrypt
    const readyToDecrypt = hasEncryptedNote && (
        cipherFlag === true || // Own keypair - don't need previous sender
        (cipherFlag === false && formattedPreviousSender !== undefined) // ECDH - need previous sender
    );

    // Step 4: Decrypt the data - only when we have all required data
    // Build flat [c0, c1, c2, c3, timestamp] tuple from (uint256[] ciphertext, uint256 timestamp, bool flag)
    // Memoized to maintain stable reference - prevents useDecryptTurmite's effect from re-running every render
    const encryptedTuple = useMemo(() => {
        if (!readyToDecrypt || !encryptedNote) return undefined;
        return [...((encryptedNote as any)[0] as bigint[]), (encryptedNote as any)[1] as bigint] as [bigint, bigint, bigint, bigint, bigint];
    }, [readyToDecrypt, encryptedNote]);

    const {
        data: decryptedData,
        isLoading: isDecrypting,
        error: decryptError,
        usedEncryptionKey,
        usedPublicKey
    } = useDecryptTurmite(
        encryptedTuple,
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
    const ownerAddress = (cipherFlag === false ? lastAddress : account.address) as string | undefined;

    // Build final result
    const data: DecryptedTokenData | null = tokenId && hasEncryptedNote && decryptedData ? {
        tokenId,
        encryptedNote: [...((encryptedNote as any)[0] as bigint[]), (encryptedNote as any)[1] as bigint, cipherFlag] as [bigint, bigint, bigint, bigint, bigint, boolean],
        decryptedData,
        usedEncryptionKey,
        cipherFlag,
        lastOwnerAddress: ownerAddress,
        lastOwnerPubKeys: usedPublicKey || []
    } : null;

    return {
        data,
        isLoading,
        error
    };
};


