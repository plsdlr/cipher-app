import React from 'react';

interface TransactionButtonProps {
    onClick?: () => void;
    isPending?: boolean;
    isConfirming?: boolean;
    disabled?: boolean;
    className?: string;
    idleText: string;
    pendingText?: string;
    confirmingText?: string;
    type?: 'button' | 'submit' | 'reset';
}

/**
 * Reusable button component that automatically adjusts text and state
 * based on transaction progress
 */
export const TransactionButton: React.FC<TransactionButtonProps> = ({
    onClick,
    isPending = false,
    isConfirming = false,
    disabled = false,
    className = '',
    idleText,
    pendingText = 'Submitting...',
    confirmingText = 'Confirming...',
    type = 'button',
}) => {
    // Determine button text based on transaction state
    const getButtonText = () => {
        if (isPending) return pendingText;
        if (isConfirming) return confirmingText;
        return idleText;
    };

    // Button is disabled if transaction is in progress or explicitly disabled
    const isDisabled = isPending || isConfirming || disabled;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            className={className}
        >
            {getButtonText()}
        </button>
    );
};
