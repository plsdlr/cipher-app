import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi.ts';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';


/// this is a boilerplate not ready yet

interface UseSendTokenResult {
    sendToken: (tokenId: string, receiverAddress: string, decryptedData: any, encryptionKey: [bigint, bigint]) => Promise<void>;
    isSending: boolean;
    isConfirming: boolean;
    error: string | null;
    txHash: string | null;
    isSuccess: boolean;
    reset: () => void;
}

export const useSendToken = (): UseSendTokenResult => {
    const { publicKey, poseidonEncryption } = useWallet();
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    // Contract write hook
    const {
        writeContract,
        isPending: isSending,
        error: writeError,
        reset: resetWrite
    } = useWriteContract();

    // Transaction confirmation hook
    const {
        isLoading: isConfirming,
        isSuccess,
        error: confirmError
    } = useWaitForTransactionReceipt({
        hash: txHash as `0x${string}` | undefined,
    });

    const sendToken = async (
        tokenId: string,
        receiverAddress: string,
        decryptedData: any,
        encryptionKey: [bigint, bigint]
    ) => {
        if (!publicKey) {
            setError("Wallet not connected");
            return;
        }

        try {
            setError(null);

            // Re-encrypt the data for the new recipient
            // You'll need to implement this based on your encryption logic
            const timestamp = BigInt(Math.floor(Date.now() / 1000));
            const reEncryptedData = poseidonEncryption(
                timestamp,
                encryptionKey,
                decryptedData // This should be the encoded data ready for encryption
            );

            // Send the transaction
            const hash = await writeContract({
                abi: EncryptedNFTABI,
                address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
                functionName: 'safeTransferFrom', // or your custom transfer function
                args: [
                    publicKey, // from
                    receiverAddress, // to
                    tokenId,
                    // Add any additional args your contract needs
                    // like the re-encrypted data
                ],
            });

            setTxHash(hash);
            console.log(`✅ Transaction sent: ${hash}`);

        } catch (err: any) {
            console.error('❌ Send token error:', err);
            setError(err.message || "Unknown error occurred");
        }
    };

    const reset = () => {
        setError(null);
        setTxHash(null);
        resetWrite();
    };

    return {
        sendToken,
        isSending,
        isConfirming,
        error: error || writeError?.message || confirmError?.message || null,
        txHash,
        isSuccess,
        reset
    };
};