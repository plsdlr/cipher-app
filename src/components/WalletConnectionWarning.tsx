import React from 'react';

interface WalletConnectionWarningProps {
    message?: string;
    title?: string;
}

/**
 * Reusable component to display a warning when wallets are not connected
 */
export const WalletConnectionWarning: React.FC<WalletConnectionWarningProps> = ({
    message = "Please connect your wallet to continue.",
    title = "⚠ Wallet Not Connected"
}) => {
    return (
        <div style={{
            color: 'red',
            marginBottom: '10px',
            padding: '10px',
            border: '1px solid red',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 0, 0, 0.05)'
        }}>
            <strong>{title}</strong>
            <p style={{ margin: '5px 0 0 0' }}>{message}</p>
        </div>
    );
};
