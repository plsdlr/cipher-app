import React from 'react';

interface WalletConnectionWarningProps {
    message?: string;
    title?: string;
    compact?: boolean;
}

/**
 * Reusable component to display a warning when wallets are not connected
 */
export const WalletConnectionWarning: React.FC<WalletConnectionWarningProps> = ({
    message = "Please connect your wallet to continue.",
    title = "⚠ Wallet Not Connected",
    compact = false
}) => {
    if (compact) {
        return (
            <div className="wallet-warning-compact">
                {message}
            </div>
        );
    }

    return (
        <div className="wallet-warning">
            <strong className="wallet-warning-title">{title}</strong>
            <p className="wallet-warning-message">{message}</p>
        </div>
    );
};
