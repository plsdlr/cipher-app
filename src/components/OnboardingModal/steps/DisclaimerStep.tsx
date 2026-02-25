import React, { useState } from 'react';

interface DisclaimerStepProps {
    onAccept: () => void;
}

const DisclaimerStep: React.FC<DisclaimerStepProps> = ({ onAccept }) => {
    const [accepted, setAccepted] = useState(false);

    return (
        <div className="onboarding-step disclaimer-step">
            <h2>Security Disclaimer</h2>

            <div className="disclaimer-content">
                <p>
                    Welcome to Cipher. Before proceeding, please understand the following:
                </p>

                <ul className="disclaimer-list">
                    <li>
                        <strong>Artwork:</strong> Cipher is an cryptographic artwork and should be treated as this. Its not an speculative asset. Its not an investment.
                    </li>
                    <li>
                        <strong>Self-Custody:</strong> You are solely responsible for securing your cipher wallet and private key.
                    </li>
                    <li>
                        <strong>Password Protection:</strong> Your cipher key will be encrypted with a password and stored in your browser. Choose a strong password.
                    </li>
                    <li>
                        <strong>Backup Required:</strong> Export and securely backup your private key. If you lose access to this browser or forget your password, your cipher assets may be unrecoverable.
                    </li>
                    <li>
                        <strong>Experimental Software:</strong> Cipher is experimental cryptographic software. Use at your own risk. Using this protocoll might result in the loss of the ether you used for minting or buying.
                    </li>
                </ul>
            </div>

            <div className="disclaimer-checkbox">
                <label>
                    <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                    />
                    <span>I understand and accept responsibility for my cipher wallet</span>
                </label>
            </div>

            <div className="onboarding-actions">
                <button
                    onClick={onAccept}
                    disabled={!accepted}
                    className="primary-button"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default DisclaimerStep;
