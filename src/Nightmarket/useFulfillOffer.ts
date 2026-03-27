import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NightMarketABI, NightMarket_CONTRACT_ADDRESS } from '../contractABI/NightMarket/contractAbi';
import { type BaseError } from 'viem';

interface ProofCalldata {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
    publivInput: string[];
}

interface UseFulfillOfferResult {
    fulfillOffer: (
        offerId: bigint,
        from: string,
        to: string,
        tokenId: bigint,
        proofCalldata: ProofCalldata
    ) => Promise<void>;
    isPending: boolean;
    isConfirming: boolean;
    isSuccess: boolean;
    error: string | null;
    txHash: string | null;
    reset: () => void;
}

/**
 * Hook for fulfilling an offer by selling an NFT to the buyer
 * This executes a ZK-verified transfer through the marketplace contract
 *
 * @param offerId - ID of the offer to fulfill
 * @param from - Seller address (must be msg.sender and current token owner)
 * @param to - Buyer address (must match offer.buyer)
 * @param tokenId - Token ID being sold
 * @param proofCalldata - ZK proof data including:
 *   - a: proof parameter A
 *   - b: proof parameter B
 *   - c: proof parameter C
 *   - publivInput: public signals (13 elements)
 */
export const useFulfillOffer = (): UseFulfillOfferResult => {
    const [error, setError] = useState<string | null>(null);

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

    const fulfillOffer = async (
        offerId: bigint,
        from: string,
        to: string,
        tokenId: bigint,
        proofCalldata: ProofCalldata
    ) => {
        try {
            setError(null);

            // Call fulfillOffer on the marketplace contract
            await writeContractAsync({
                abi: NightMarketABI,
                address: NightMarket_CONTRACT_ADDRESS[1] as `0x${string}`,
                functionName: 'fulfillOffer',
                args: [
                    offerId,
                    from as `0x${string}`,
                    to as `0x${string}`,
                    tokenId,
                    proofCalldata.a,
                    proofCalldata.b,
                    proofCalldata.c,
                    proofCalldata.publivInput
                ],
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
        fulfillOffer,
        isPending,
        isConfirming,
        isSuccess,
        error: error || (writeError ? ((writeError as BaseError).shortMessage || writeError.message) : null) || (confirmError ? ((confirmError as BaseError).shortMessage || confirmError.message) : null) || null,
        txHash: txHash ?? null,
        reset
    };
};
