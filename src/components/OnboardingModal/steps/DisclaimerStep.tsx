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
                    Welcome to Cipher. A few things to know before you start:
                </p>

                <ul className="disclaimer-list">
                    <li>
                        <strong>Artwork, not an asset:</strong> Cipher is a cryptographic artwork — not an investment, not a speculative asset, and only tradable at the nightmarket due to trustless encryption.
                    </li>
                    <li>
                        <strong>Your key, your responsibility:</strong> Your Cipher key is encrypted with a password and stored in your browser. Back it up. Lose it and your Ciphers become unencryptable — no resets, no support.
                    </li>
                    <li>
                        <strong>Experimental software:</strong> Use at your own risk — including any ETH spent minting or trading.
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
