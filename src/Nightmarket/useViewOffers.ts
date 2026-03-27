import { useReadContract } from 'wagmi';
import { NightMarketABI, NightMarket_CONTRACT_ADDRESS } from '../contractABI/NightMarket/contractAbi';

export interface Offer {
    buyer: string;
    price: bigint;
}

interface UseViewOffersResult {
    offers: Offer[] | undefined;
    offerIds: bigint[] | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

/**
 * Hook to view all offers in a range
 * @param start Starting offer ID (inclusive)
 * @param end Ending offer ID (exclusive)
 */
export const useViewOffers = (start: number = 0, end: number = 100): UseViewOffersResult => {
    const contractAddress = NightMarket_CONTRACT_ADDRESS[1] as `0x${string}`;

    const {
        data,
        isLoading,
        error,
        refetch
    } = useReadContract({
        abi: NightMarketABI,
        address: contractAddress,
        functionName: 'getOffers',
        args: [BigInt(start), BigInt(end)],
        query: {
            enabled: end > start,
        }
    });

    // Parse the response: [offerIds[], offers[]]
    const offerIds = (data as any)?.[0] as bigint[] | undefined;
    const offers = (data as any)?.[1] as Offer[] | undefined;

    return {
        offers,
        offerIds,
        isLoading,
        error,
        refetch
    };
};

/**
 * Hook to view offers by a specific address
 * @param buyerAddress Address of the buyer to query offers for
 */
export const useViewOffersByAddress = (buyerAddress?: string): UseViewOffersResult => {
    const contractAddress = NightMarket_CONTRACT_ADDRESS[1] as `0x${string}`;

    const {
        data,
        isLoading,
        error,
        refetch
    } = useReadContract({
        abi: NightMarketABI,
        address: contractAddress,
        functionName: 'getOffersByAddress',
        args: buyerAddress ? [buyerAddress as `0x${string}`] : undefined,
        query: {
            enabled: !!buyerAddress
        }
    });

    // Parse the response: [offerIds[], offers[]]
    const offerIds = (data as any)?.[0] as bigint[] | undefined;
    const offers = (data as any)?.[1] as Offer[] | undefined;

    return {
        offers,
        offerIds,
        isLoading,
        error,
        refetch
    };
};

/**
 * Hook to get the current total number of offers
 */
export const useCurrentOffers = () => {
    const contractAddress = NightMarket_CONTRACT_ADDRESS[1] as `0x${string}`;

    const { data, isLoading, error, refetch } = useReadContract({
        abi: NightMarketABI,
        address: contractAddress,
        functionName: 'currentOffers',
    });

    return {
        currentOffers: data as bigint | undefined,
        isLoading,
        error,
        refetch
    };
};
