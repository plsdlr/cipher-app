import React from 'react';
import { useWalletStatus } from '../hooks/useWalletStatus';
import { WalletConnectionWarning } from './WalletConnectionWarning';

interface RequireWalletsProps {
    children: React.ReactNode;
    requireEth?: boolean;
    requireCipher?: boolean;
    renderMode?: 'full' | 'inline';
}

/**
 * Wrapper component that checks wallet connections before rendering children
 * Use this to wrap any buttons or forms that require wallet connections
 *
 * @example
 * <RequireWallets>
 *   <button onClick={handleMint}>Mint NFT</button>
 * </RequireWallets>
 *
 * @example
 * // Only require ETH wallet
 * <RequireWallets requireEth>
 *   <button onClick={handleTransaction}>Send Transaction</button>
 * </RequireWallets>
 *
 * @example
 * // Use inline mode (for table cells or compact spaces)
 * <RequireWallets renderMode="inline">
 *   <button onClick={handleAction}>Action</button>
 * </RequireWallets>
 */
export const RequireWallets: React.FC<RequireWalletsProps> = ({
    children,
    requireEth = true,
    requireCipher = true,
    renderMode = 'full'
}) => {
    const { isEthConnected, isCipherConnected, getMissingWalletMessage } = useWalletStatus();

    // Check if requirements are met
    const ethRequirementMet = !requireEth || isEthConnected;
    const cipherRequirementMet = !requireCipher || isCipherConnected;
    const allRequirementsMet = ethRequirementMet && cipherRequirementMet;

    // If all requirements are met, render children
    if (allRequirementsMet) {
        return <>{children}</>;
    }

    // Otherwise, show appropriate warning based on render mode
    const message = getMissingWalletMessage();

    if (!message) return null;

    if (renderMode === 'inline') {
        return (
            <span className="wallet-warning-inline">
                {message}
            </span>
        );
    }

    return <WalletConnectionWarning message={message} compact={false} />;
};
