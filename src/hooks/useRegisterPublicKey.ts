import { useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi';

export const useRegisterPublicKey = () => {
    const account = useAccount();
    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
    const formattedAddress = contractAddress as `0x${string}`;

    const {
        data: registerHash,
        error: registerError,
        isPending: isRegisterPending,
        writeContract
    } = useWriteContract();

    const {
        isLoading: isRegisterConfirming,
        isSuccess: isRegisterConfirmed
    } = useWaitForTransactionReceipt({
        hash: registerHash,
    });

    const { data: addressRegistered, refetch } = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'userPublicKeys',
        args: [account.address, 0],
        query: {
            enabled: !!account.address
        }
    });

    // Refetch registration status once transaction is confirmed
    useEffect(() => {
        if (isRegisterConfirmed) {
            refetch();
        }
    }, [isRegisterConfirmed, refetch]);

    const register = (publicKey: [bigint, bigint]) => {
        writeContract({
            address: formattedAddress,
            abi: EncryptedNFTABI,
            functionName: 'registerPublicKey',
            args: [publicKey[0], publicKey[1]],
        });
    };

    return {
        register,
        registerHash,
        registerError,
        isRegisterPending,
        isRegisterConfirming,
        isRegisterConfirmed,
        hasRegisteredKey: !!addressRegistered,
        refetch,
    };
};
