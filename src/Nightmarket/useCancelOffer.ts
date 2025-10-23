import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NightMarketABI, NightMarket_CONTRACT_ADDRESS } from '../contractABI/NightMarket/contractAbi';

interface UseCancelOfferResult {
    cancelOffer: (offerId: bigint) => Promise<void>;
    isPending: boolean;
    isConfirming: boolean;
    isSuccess: boolean;
    error: string | null;
    txHash: string | null;
    reset: () => void;
}

export const useCancelOffer = (): UseCancelOfferResult => {
    const [error, setError] = useState<string | null>(null);

    // Contract write hook
    const {
        data: txHash,
        writeContract,
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

    const cancelOffer = async (offerId: bigint) => {
        try {
            setError(null);

            // Call cancelOffer
            writeContract({
                abi: NightMarketABI,
                address: NightMarket_CONTRACT_ADDRESS[11155111] as `0x${string}`,
                functionName: 'cancelOffer',
                args: [offerId],
            });

        } catch (err: any) {
            setError(err.message || "Unknown error occurred");
        }
    };

    const reset = () => {
        setError(null);
        resetWrite();
    };

    return {
        cancelOffer,
        isPending,
        isConfirming,
        isSuccess,
        error: error || writeError?.message || confirmError?.message || null,
        txHash,
        reset
    };
};
