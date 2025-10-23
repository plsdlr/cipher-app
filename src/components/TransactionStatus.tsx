import React from 'react';

interface TransactionStatusProps {
    isPending?: boolean;
    isConfirming?: boolean;
    isSuccess?: boolean;
    error?: string | null;
    txHash?: string | null;
    pendingMessage?: string;
    confirmingMessage?: string;
    successMessage?: string;
    showTxHash?: boolean;
}

/**
 * Reusable component for displaying transaction status
 * Handles pending, confirming, success, and error states
 */
export const TransactionStatus: React.FC<TransactionStatusProps> = ({
    isPending = false,
    isConfirming = false,
    isSuccess = false,
    error = null,
    txHash = null,
    pendingMessage = 'Submitting transaction...',
    confirmingMessage = 'Confirming on blockchain...',
    successMessage = 'Transaction confirmed!',
    showTxHash = true,
}) => {
    // Don't render if no active state
    if (!isPending && !isConfirming && !isSuccess && !error) {
        return null;
    }

    return (
        <div className="transaction-status">
            {/* Pending state */}
            {isPending && !isConfirming && (
                <p>{pendingMessage}</p>
            )}

            {/* Confirming state */}
            {isConfirming && !isSuccess && (
                <p>{confirmingMessage}</p>
            )}

            {/* Success state */}
            {isSuccess && (
                <p>{successMessage}</p>
            )}

            {/* Error state */}
            {error && (
                <p>Error: {error}</p>
            )}

            {/* Transaction hash display */}
            {showTxHash && txHash && (
                <div className="transaction-info">
                    <p>Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
                </div>
            )}
        </div>
    );
};
