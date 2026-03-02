import { useState, useEffect, useRef } from 'react';
import { useMakeOffer } from './useMakeOffer';
import { useConsole } from '../console/ConsoleContext';
import OffersList from './OffersList';
import { TransactionStatus, TransactionButton, RequireWallets } from '../components';

const MarketPage = () => {
    const [showOfferForm, setShowOfferForm] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');
    const { addMessage } = useConsole();

    // Ref to track processed transactions and prevent duplicate messages
    const lastProcessedTx = useRef<string | null>(null);

    const {
        makeOffer,
        isPending,
        isConfirming,
        isSuccess,
        error,
        txHash,
        reset
    } = useMakeOffer();

    // Handle successful offer creation
    useEffect(() => {
        if (isSuccess && txHash && lastProcessedTx.current !== txHash) {
            lastProcessedTx.current = txHash;
            addMessage(`✓ Offer created successfully! TX: ${txHash}`, "success");
            setShowOfferForm(false);
            setOfferAmount('');
            // Reset after a delay
            setTimeout(() => {
                reset();
            }, 3000);
        }
    }, [isSuccess, txHash, addMessage, reset]);

    // Handle errors
    useEffect(() => {
        if (error) {
            addMessage(`✗ Error creating offer: ${error}`, "error");
        }
    }, [error, addMessage]);

    const handleMakeOfferClick = () => {
        setShowOfferForm(true);
        addMessage("Opening offer creation form", "info");
    };

    const handleDepositClick = async () => {
        if (!offerAmount || parseFloat(offerAmount) <= 0) {
            addMessage("Please enter a valid offer amount", "error");
            return;
        }

        addMessage(`Creating offer for ${offerAmount} ETH...`, "info");
        await makeOffer(offerAmount);
    };

    const handleCancel = () => {
        setShowOfferForm(false);
        setOfferAmount('');
        addMessage("Offer creation cancelled", "info");
    };

    return (
        <div className="market-page">
            <fieldset className="terminal-fieldset">
                <legend>NIGHTMARKET</legend>

                <div className="market-content">
                    <p>Create an offer to buy encrypted NFTs on the marketplace</p>

                    {/* Show "Make Offer" button when form is hidden */}
                    {!showOfferForm && !isPending && !isConfirming && (
                        <RequireWallets>
                            <button
                                className="make-offer-button"
                                onClick={handleMakeOfferClick}
                            >
                                Make Offer
                            </button>
                        </RequireWallets>
                    )}

                    {/* Show offer form when button is clicked */}
                    {showOfferForm && (
                        <RequireWallets>
                            <div className="offer-form">
                                <fieldset className="terminal-fieldset">
                                    <legend>Create Offer</legend>

                                    <div className="form-group">
                                        <label htmlFor="offer-amount">Offer Amount (ETH):</label>
                                        <input
                                            type="number"
                                            id="offer-amount"
                                            placeholder="0.1"
                                            step="0.001"
                                            min="0"
                                            value={offerAmount}
                                            onChange={(e) => setOfferAmount(e.target.value)}
                                            disabled={isPending || isConfirming}
                                        />
                                    </div>

                                    <div className="button-group">
                                        <TransactionButton
                                            onClick={handleDepositClick}
                                            isPending={isPending}
                                            isConfirming={isConfirming}
                                            disabled={!offerAmount}
                                            className="deposit-button"
                                            idleText="Deposit"
                                        />
                                        <button
                                            className="cancel-button"
                                            onClick={handleCancel}
                                            disabled={isPending || isConfirming}
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <TransactionStatus
                                        isPending={isPending}
                                        isConfirming={isConfirming}
                                        isSuccess={isSuccess}
                                        error={error}
                                        txHash={txHash}
                                        pendingMessage="Submitting offer transaction..."
                                        confirmingMessage="Waiting for blockchain confirmation..."
                                        successMessage="Offer created successfully!"
                                    />
                                </fieldset>
                            </div>
                        </RequireWallets>
                    )}

                    {/* Show status during transaction */}
                    {!showOfferForm && (
                        <TransactionStatus
                            isPending={isPending}
                            isConfirming={isConfirming}
                            isSuccess={isSuccess}
                            error={error}
                            txHash={txHash}
                            pendingMessage="Submitting offer transaction..."
                            confirmingMessage="Waiting for blockchain confirmation..."
                            successMessage="Offer created successfully!"
                        />
                    )}
                </div>
            </fieldset>

            {/* Display latest offers */}
            <OffersList />
        </div>
    );
};

export default MarketPage;
