import React, { useEffect } from 'react';
import { useWallet } from '../../../cipherWallet/cipherWallet';
import { useAccount } from 'wagmi';
import { type BaseError } from 'viem';
import { useRegisterPublicKey } from '../../../hooks/useRegisterPublicKey';
import EthWallet from '../../../ETHWalletConnector/EthConnector';
import { useWalletStatus } from '../../../hooks/useWalletStatus';

interface RegisterOnChainStepProps {
    onComplete: () => void;
    onSkip: () => void;
    onBack: () => void;
}

const RegisterOnChainStep: React.FC<RegisterOnChainStepProps> = ({ onComplete, onSkip, onBack }) => {
    const { publicKey } = useWallet();
    const account = useAccount();
    const { isCorrectNetwork } = useWalletStatus();

    const {
        register,
        registerHash,
        registerError,
        isRegisterPending,
        isRegisterConfirming,
        isRegisterConfirmed,
    } = useRegisterPublicKey();

    // Auto-complete when registration is confirmed
    useEffect(() => {
        if (isRegisterConfirmed) {
            onComplete();
        }
    }, [isRegisterConfirmed, onComplete]);

    const handleRegister = () => {
        if (!publicKey) return;
        register(publicKey);
    };

    const formatBigInt = (value: bigint): string => {
        const str = value.toString();
        return str.length > 10 ? `${str.substring(0, 5)}...${str.substring(str.length - 5)}` : str;
    };

    const isEthConnected = account.status === 'connected';
    const isReadyToRegister = isEthConnected && isCorrectNetwork;
    const isLoading = isRegisterPending || isRegisterConfirming;

    return (
        <div className="onboarding-step register-step">
            <h2>Register On-Chain (Optional)</h2>

            <p>
                Register your cipher public key on the blockchain to receive encrypted NFTs from other users.
            </p>

            {publicKey && (
                <div className="public-key-display">
                    <label>Your Cipher Public Key:</label>
                    <div className="key-value">
                        [{formatBigInt(publicKey[0])}, {formatBigInt(publicKey[1])}]
                    </div>
                </div>
            )}

            <div className="eth-connect-section">
                <p className="connect-prompt">Connect your Ethereum wallet to register on-chain:</p>
                <EthWallet />
            </div>

            {isReadyToRegister && (
                <div className="register-section">
                    {registerError && (
                        <div className="message error">
                            Registration failed: {(registerError as BaseError).shortMessage || registerError.message}
                        </div>
                    )}

                    {registerHash && !isRegisterConfirmed && (
                        <div className="message info">
                            Transaction submitted. Waiting for confirmation...
                        </div>
                    )}

                    {isRegisterConfirmed && (
                        <div className="message success">
                            Public key registered successfully!
                        </div>
                    )}
                </div>
            )}

            <div className="onboarding-actions">
                <button
                    type="button"
                    onClick={onBack}
                    className="secondary-button"
                    disabled={isLoading}
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={onSkip}
                    className="skip-button"
                    disabled={isLoading}
                >
                    Skip for Now
                </button>
                {isReadyToRegister && (
                    <button
                        type="button"
                        onClick={handleRegister}
                        className="primary-button"
                        disabled={isLoading || !publicKey}
                    >
                        {isRegisterPending ? 'Submitting...' :
                            isRegisterConfirming ? 'Confirming...' :
                                'Register Now'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default RegisterOnChainStep;
