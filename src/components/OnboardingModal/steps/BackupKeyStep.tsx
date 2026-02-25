import React, { useState } from 'react';
import { useWallet } from '../../../cipherWallet/cipherWallet';

interface BackupKeyStepProps {
    onComplete: () => void;
    onBack: () => void;
}

const BackupKeyStep: React.FC<BackupKeyStepProps> = ({ onComplete, onBack }) => {
    const { privateKey } = useWallet();
    const [hasCopied, setHasCopied] = useState(false);
    const [hasConfirmed, setHasConfirmed] = useState(false);

    const formatPrivateKeyFull = (key: Uint8Array): string => {
        return Array.from(key)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    };

    const handleCopy = async () => {
        if (!privateKey) return;

        try {
            await navigator.clipboard.writeText(formatPrivateKeyFull(privateKey));
            setHasCopied(true);
        } catch (err) {
            // Fallback for browsers that don't support clipboard API
            const textArea = document.createElement('textarea');
            textArea.value = formatPrivateKeyFull(privateKey);
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setHasCopied(true);
        }
    };

    const canContinue = hasCopied && hasConfirmed;

    return (
        <div className="onboarding-step backup-key-step">
            <h2>Backup Your Private Key</h2>

            <div className="backup-warning">
                <strong>Important:</strong> Your private key is also shown in the cipher wallet, but you can allready back it up
                and store it somewhere safe. If you lose access to this browser or forget your password,
                you will need this key to recover your cipher wallet.
            </div>

            {privateKey && (
                <div className="private-key-display">
                    <label>Your Cipher Private Key:</label>
                    <div className="key-value private">
                        {formatPrivateKeyFull(privateKey)}
                    </div>
                    <button
                        onClick={handleCopy}
                        className={`copy-button ${hasCopied ? 'copied' : ''}`}
                    >
                        {hasCopied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </div>
            )}

            <div className="backup-instructions">
                <p>Recommended backup methods:</p>
                <ul>
                    <li>Write it down on paper and store securely</li>
                    <li>Save in a password manager</li>
                    <li>Store in an encrypted file</li>
                </ul>
            </div>

            <div className="disclaimer-checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={hasConfirmed}
                        onChange={(e) => setHasConfirmed(e.target.checked)}
                    />
                    <span>I have backed up my private key in a secure location</span>
                </label>
            </div>

            <div className="onboarding-actions">
                <button
                    type="button"
                    onClick={onBack}
                    className="secondary-button"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={onComplete}
                    disabled={!canContinue}
                    className="primary-button"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default BackupKeyStep;
