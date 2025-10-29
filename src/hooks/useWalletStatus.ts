import { useAccount } from 'wagmi';
import { useWallet } from '../cipherWallet/cipherWallet';

export interface WalletStatus {
    // ETH Wallet
    isEthConnected: boolean;
    ethAddress: `0x${string}` | undefined;

    // Cipher Wallet
    isCipherConnected: boolean;
    cipherPublicKey: [bigint, bigint] | null;

    // Combined status
    bothConnected: boolean;

    // Helper to get missing wallet message
    getMissingWalletMessage: () => string | null;
}

/**
 * Custom hook that checks the connection status of both ETH and Cipher wallets
 * Use this hook anywhere you need to verify wallet connections before transactions or proofs
 */
export const useWalletStatus = (): WalletStatus => {
    const { address: ethAddress, isConnected: isEthConnected } = useAccount();
    const { publicKey: cipherPublicKey, privateKey } = useWallet();

    const isCipherConnected = !!(cipherPublicKey && privateKey);
    const bothConnected = isEthConnected && isCipherConnected;

    const getMissingWalletMessage = (): string | null => {
        if (!isEthConnected && !isCipherConnected) {
            return 'Please connect both your Ethereum wallet and Cipher wallet.';
        }
        if (!isEthConnected) {
            return 'Please connect your Ethereum wallet.';
        }
        if (!isCipherConnected) {
            return 'Please connect your Cipher wallet.';
        }
        return null;
    };

    return {
        isEthConnected,
        ethAddress,
        isCipherConnected,
        cipherPublicKey,
        bothConnected,
        getMissingWalletMessage
    };
};
