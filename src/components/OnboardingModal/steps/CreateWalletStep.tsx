import React, { useState } from 'react';
import { useWallet } from '../../../cipherWallet/cipherWallet';

interface CreateWalletStepProps {
    onComplete: () => void;
    onBack: () => void;
}

const CreateWalletStep: React.FC<CreateWalletStepProps> = ({ onComplete, onBack }) => {
    const { createWallet } = useWallet();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validatePassword = (): boolean => {
        if (password.length < 5) {
            setError('Password must be at least 5 characters');
            return false;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePassword()) return;

        setIsLoading(true);
        setError('');

        try {
            const success = await createWallet(password);
            if (success) {
                onComplete();
            } else {
                setError('Failed to create wallet. Please try again.');
            }
        } catch (err) {
            setError('An error occurred while creating the wallet.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="onboarding-step create-wallet-step">
            <h2>Create Cipher Wallet</h2>

            <p>
                Create a password to encrypt your cipher wallet. This wallet will be stored securely in your browser.
            </p>

            <form onSubmit={handleSubmit} className="wallet-form">
                <div className="form-group">
                    <label htmlFor="onboarding-password">Password:</label>
                    <input
                        type="password"
                        id="onboarding-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={5}
                        placeholder="At least 5 characters"
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="onboarding-confirm-password">Confirm Password:</label>
                    <input
                        type="password"
                        id="onboarding-confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={5}
                        placeholder="Confirm your password"
                        disabled={isLoading}
                    />
                </div>

                {error && (
                    <div className="message error">
                        {error}
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
                        type="submit"
                        className="primary-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Create Wallet'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateWalletStep;
