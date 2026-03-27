import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NightMarketABI, NightMarket_CONTRACT_ADDRESS } from '../contractABI/NightMarket/contractAbi';
import { parseEther, type BaseError } from 'viem';

interface UseMakeOfferResult {
    makeOffer: (priceInEth: string) => Promise<void>;
    isPending: boolean;
    isConfirming: boolean;
    isSuccess: boolean;
    error: string | null;
    txHash: string | null;
    offerId: bigint | null;
    reset: () => void;
}

export const useMakeOffer = (): UseMakeOfferResult => {
    const [error, setError] = useState<string | null>(null);
    const [offerId, setOfferId] = useState<bigint | null>(null);

    // Contract write hook
    const {
        data: txHash,
        writeContractAsync,
        isPending,
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

    const makeOffer = async (priceInEth: string) => {
        try {
            setError(null);

            // Validate price
            const price = parseFloat(priceInEth);
            if (isNaN(price) || price <= 0) {
                setError("Invalid price. Must be greater than 0.");
                return;
            }

            // Convert ETH to Wei
            const priceInWei = parseEther(priceInEth);

            // Call createOffer with ETH value
            await writeContractAsync({
                abi: NightMarketABI,
                address: NightMarket_CONTRACT_ADDRESS[1] as `0x${string}`,
                functionName: 'createOffer',
                args: [], // No arguments, just send ETH
                value: priceInWei, // Send ETH as the offer price
            });

        } catch (err: any) {
            setError(err.message || "Unknown error occurred");
        }
    };

    const reset = () => {
        setError(null);
        setOfferId(null);
        resetWrite();
    };

    return {
        makeOffer,
        isPending,
        isConfirming,
        isSuccess,
        error: error || (writeError ? ((writeError as BaseError).shortMessage || writeError.message) : null) || (confirmError ? ((confirmError as BaseError).shortMessage || confirmError.message) : null) || null,
        txHash: txHash ?? null,
        offerId,
        reset
    };
};
