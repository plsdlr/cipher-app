import React, { useEffect, useState } from 'react';
import { useViewOffers, useCurrentOffers } from './useViewOffers';
import { useCancelOffer } from './useCancelOffer';
import { useFulfillOffer } from './useFulfillOffer';
import { useAccount, useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import { useConsole } from '../console/ConsoleContext';
import { formatEther } from 'viem';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi';
import { NightMarket_CONTRACT_ADDRESS } from '../contractABI/NightMarket/contractAbi';
import { useWallet } from '../cipherWallet/cipherWallet';
import { useDecryptToken } from '../ViewAndSendPage/useDecryptToken';
import { generateProofTransfer } from '../ProofSystem/ProofSystem';
import { timeStamp } from '../utils/encodingUtils';

interface FulfillmentState {
    offerId: bigint;
    buyerAddress: string;
    price: bigint;
}

const OffersList = () => {
    const { address: connectedAddress } = useAccount();
    const { addMessage } = useConsole();
    const [cancellingOfferId, setCancellingOfferId] = useState<bigint | null>(null);
    const [fulfillingOffer, setFulfillingOffer] = useState<FulfillmentState | null>(null);
    const [tokenIdToSell, setTokenIdToSell] = useState<string>('');
    const [shouldFetchTokens, setShouldFetchTokens] = useState<boolean>(false);
    const [shouldFetchBuyerKey, setShouldFetchBuyerKey] = useState<boolean>(false);
    const [generatedProof, setGeneratedProof] = useState<any>(null);
    const [transactionStatus, setTransactionStatus] = useState<string>('idle');
    const [calculatedEncryptionKey, setCalculatedEncryptionKey] = useState<any>(null);
    const [isApproved, setIsApproved] = useState<boolean>(false);

    const {
        publicKey,
        privateKey,
        secretScalar,
        genEcdhSharedKey,
        poseidonEncryption,
    } = useWallet();

    const {
        fulfillOffer,
        isPending: isFulfillPending,
        isConfirming: isFulfillConfirming,
        isSuccess: isFulfillSuccess,
        error: fulfillError,
        txHash: fulfillTxHash,
        reset: resetFulfill
    } = useFulfillOffer();

    // Hook for approving NFT
    const {
        writeContract: approveNFT,
        isPending: isApprovePending,
        isSuccess: isApproveSuccess,
        error: approveError
    } = useWriteContract();

    const { currentOffers, isLoading: isLoadingCount, refetch: refetchCount } = useCurrentOffers();

    // Fetch user's owned tokens when fulfilling an offer
    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
    const formattedAddress = contractAddress as `0x${string}`;

    // Decrypt the token that will be sold
    const { data: decryptedToken } = useDecryptToken(tokenIdToSell || null);

    // Check if marketplace is approved for the token
    const { data: approvedAddress, refetch: refetchApproval } = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'getApproved',
        args: tokenIdToSell ? [BigInt(tokenIdToSell)] : undefined,
        query: {
            enabled: !!tokenIdToSell
        }
    });

    const marketplaceAddress = NightMarket_CONTRACT_ADDRESS[11155111] as `0x${string}`;

    // Fetch buyer's public key from contract
    const { data: buyerPublicKey, isLoading: isLoadingBuyerKey } = useReadContracts({
        contracts: [
            {
                abi: EncryptedNFTABI,
                address: formattedAddress,
                functionName: 'userPublicKeys',
                args: [fulfillingOffer?.buyerAddress as `0x${string}`, 0],
            },
            {
                abi: EncryptedNFTABI,
                address: formattedAddress,
                functionName: 'userPublicKeys',
                args: [fulfillingOffer?.buyerAddress as `0x${string}`, 1],
            }
        ],
        query: {
            enabled: shouldFetchBuyerKey && !!fulfillingOffer?.buyerAddress
        }
    });

    const {
        data: ownedTokenIds,
        isLoading: isLoadingTokens,
        error: tokenError,
        refetch: refetchTokens
    } = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'returnTokenIdsOfOwner',
        args: ["0", "200", connectedAddress],
        query: {
            enabled: shouldFetchTokens && !!connectedAddress
        }
    });

    // Calculate range for latest 10 offers
    const end = currentOffers ? Number(currentOffers) : 0;
    const start = Math.max(0, end - 10);

    const { offers, offerIds, isLoading, error, refetch } = useViewOffers(start, end);

    const {
        cancelOffer,
        isPending: isCancelPending,
        isConfirming: isCancelConfirming,
        isSuccess: isCancelSuccess,
        error: cancelError,
        txHash: cancelTxHash,
        reset: resetCancel
    } = useCancelOffer();

    // Format address for display
    const formatAddress = (address: string): string => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    // Handle successful cancellation
    useEffect(() => {
        if (isCancelSuccess) {
            addMessage(`✓ Offer #${cancellingOfferId} cancelled successfully! TX: ${cancelTxHash}`, "success");
            setCancellingOfferId(null);
            // Refetch offers after successful cancellation
            refetchCount();
            refetch();
            // Reset after a delay
            setTimeout(() => {
                resetCancel();
            }, 3000);
        }
    }, [isCancelSuccess, cancellingOfferId, cancelTxHash, refetch, refetchCount, resetCancel]);

    // Handle cancel errors
    useEffect(() => {
        if (cancelError) {
            addMessage(`✗ Error cancelling offer: ${cancelError}`, "error");
        }
    }, [cancelError]);

    // Refetch when component mounts or when offers are created
    useEffect(() => {
        const interval = setInterval(() => {
            refetchCount();
            refetch();
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(interval);
    }, [refetch, refetchCount]);

    // Handle cancel button click
    const handleCancelOffer = async (offerId: bigint) => {
        setCancellingOfferId(offerId);
        addMessage(`Cancelling offer #${offerId}...`, "info");
        await cancelOffer(offerId);
    };

    // Check if an offer belongs to the connected user
    const isMyOffer = (buyerAddress: string): boolean => {
        return connectedAddress ? connectedAddress.toLowerCase() === buyerAddress.toLowerCase() : false;
    };

    // Handle fulfill offer button click
    const handleFulfillOfferClick = (offerId: bigint, buyerAddress: string, price: bigint) => {
        setFulfillingOffer({ offerId, buyerAddress, price });
        setTokenIdToSell('');
        setShouldFetchTokens(true);
        addMessage(`Preparing to fulfill offer #${offerId}...`, "info");
        addMessage(`Fetching your owned tokens...`, "info");
    };

    // Refetch tokens when fulfilling offer changes
    useEffect(() => {
        if (fulfillingOffer && connectedAddress) {
            refetchTokens();
        }
    }, [fulfillingOffer, connectedAddress, refetchTokens]);

    // Cancel fulfillment
    const handleCancelFulfillment = () => {
        setFulfillingOffer(null);
        setTokenIdToSell('');
        setShouldFetchTokens(false);
        addMessage("Fulfillment cancelled", "info");
    };

    // Handle token selection
    const handleTokenSelect = (tokenId: string) => {
        setTokenIdToSell(tokenId);
        setShouldFetchBuyerKey(true);
        setGeneratedProof(null);
        setCalculatedEncryptionKey(null);
        setTransactionStatus('idle');
        addMessage(`Selected Token ID ${tokenId}`, "info");
        addMessage(`Fetching buyer public key...`, "info");
    };

    // Get first 10 tokens
    const displayTokens = ownedTokenIds ? (ownedTokenIds as bigint[]).slice(0, 10) : [];

    // Generate proof when we have all required data
    useEffect(() => {
        const generateProof = async () => {
            if (!buyerPublicKey || isLoadingBuyerKey || !genEcdhSharedKey || !shouldFetchBuyerKey ||
                buyerPublicKey[0]?.result === undefined || buyerPublicKey[1]?.result === undefined ||
                calculatedEncryptionKey || !decryptedToken || !privateKey || !secretScalar) {
                return;
            }

            try {
                setTransactionStatus('preparing');
                addMessage('Calculating encryption key for buyer...', "info");

                const toPublicKey: [bigint, bigint] = [
                    buyerPublicKey[0].result as bigint,
                    buyerPublicKey[1].result as bigint
                ];

                // Validate buyer has registered public key
                if (toPublicKey[0] === 0n && toPublicKey[1] === 0n) {
                    setTransactionStatus('error');
                    addMessage('Buyer has not registered their public key', "error");
                    return;
                }

                // Calculate shared encryption key
                const encryptionKey = genEcdhSharedKey(toPublicKey);
                setCalculatedEncryptionKey(encryptionKey);

                addMessage('Generating ZK proof...', "info");

                const currentTimestamp = timeStamp();
                const cipherText = poseidonEncryption(
                    currentTimestamp,
                    encryptionKey,
                    decryptedToken.decryptedData.rawDecryption
                );

                const proof = await generateProofTransfer(
                    privateKey,
                    secretScalar,
                    publicKey,
                    decryptedToken.lastOwnerPubKeys,
                    toPublicKey,
                    decryptedToken.usedEncryptionKey,
                    encryptionKey,
                    decryptedToken.decryptedData.rawDecryption,
                    decryptedToken.decryptedData.rawDecryption,
                    (decryptedToken.encryptedNote.slice(0, 4) as bigint[]),
                    cipherText,
                    [decryptedToken.encryptedNote[4]],
                    [currentTimestamp]
                );

                setGeneratedProof(proof);
                setTransactionStatus('ready');
                addMessage('✓ Proof generated successfully! Ready to fulfill offer.', "success");

            } catch (error: any) {
                setTransactionStatus('error');
                addMessage(`Error preparing transaction: ${error.message}`, "error");
            }
        };

        generateProof();
    }, [buyerPublicKey, isLoadingBuyerKey, genEcdhSharedKey, shouldFetchBuyerKey,
        calculatedEncryptionKey, decryptedToken, privateKey, secretScalar, publicKey]);

    // Handle successful fulfillment
    useEffect(() => {
        if (isFulfillSuccess) {
            addMessage(`✓ Offer fulfilled successfully! TX: ${fulfillTxHash}`, "success");

            // Refetch offers after successful fulfillment
            refetchCount();
            refetch();

            // Reset state after a delay
            setTimeout(() => {
                setFulfillingOffer(null);
                setTokenIdToSell('');
                setShouldFetchTokens(false);
                setShouldFetchBuyerKey(false);
                setGeneratedProof(null);
                setCalculatedEncryptionKey(null);
                setTransactionStatus('idle');
                resetFulfill();
            }, 3000);
        }
    }, [isFulfillSuccess, fulfillTxHash, refetch, refetchCount, resetFulfill]);

    // Handle fulfillment errors
    useEffect(() => {
        if (fulfillError) {
            addMessage(`✗ Error fulfilling offer: ${fulfillError}`, "error");
        }
    }, [fulfillError]);

    // Check approval status when approved address changes
    useEffect(() => {
        if (approvedAddress && marketplaceAddress) {
            const approved = (approvedAddress as string).toLowerCase() === marketplaceAddress.toLowerCase();
            setIsApproved(approved);
        } else {
            setIsApproved(false);
        }
    }, [approvedAddress, marketplaceAddress]);

    // Handle successful approval
    useEffect(() => {
        if (isApproveSuccess) {
            addMessage('✓ NFT approved! Checking approval status...', "success");
            setTimeout(() => {
                refetchApproval();
            }, 2000);
        }
    }, [isApproveSuccess, refetchApproval]);

    // Handle approval button click
    const handleApprove = async () => {
        if (!tokenIdToSell) return;

        addMessage(`Approving marketplace to transfer Token #${tokenIdToSell}...`, "info");

        try {
            await approveNFT({
                abi: EncryptedNFTABI,
                address: formattedAddress,
                functionName: 'approve',
                args: [marketplaceAddress, BigInt(tokenIdToSell)],
            });
        } catch (error: any) {
            addMessage(`✗ Approval failed: ${error.message}`, "error");
        }
    };

    if (isLoading || isLoadingCount) {
        return (
            <div className="offers-list">
                <fieldset className="terminal-fieldset">
                    <legend>Latest Offers</legend>
                    <p>Loading offers...</p>
                </fieldset>
            </div>
        );
    }

    if (error) {
        return (
            <div className="offers-list">
                <fieldset className="terminal-fieldset">
                    <legend>Latest Offers</legend>
                    <p className="error">Error loading offers: {error.message}</p>
                </fieldset>
            </div>
        );
    }

    if (!offers || offers.length === 0) {
        return (
            <div className="offers-list">
                <fieldset className="terminal-fieldset">
                    <legend>Latest Offers</legend>
                    <p>No active offers yet. Be the first to create one!</p>
                </fieldset>
            </div>
        );
    }

    return (
        <div className="offers-list">
            <fieldset className="terminal-fieldset">
                <legend>Latest Offers ({offers.length})</legend>

                <div className="offers-container">
                    <table className="offers-table">
                        <thead>
                            <tr>
                                <th>Offer ID</th>
                                <th>Buyer</th>
                                <th>Price (ETH)</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {offers.map((offer, index) => {
                                const offerId = offerIds?.[index];
                                const priceInEth = formatEther(offer.price);
                                const myOffer = isMyOffer(offer.buyer);
                                const isCancelling = cancellingOfferId === offerId && (isCancelPending || isCancelConfirming);

                                return (
                                    <tr key={offerId?.toString() || index}>
                                        <td>#{offerId?.toString()}</td>
                                        <td>{formatAddress(offer.buyer)}</td>
                                        <td>{parseFloat(priceInEth).toFixed(4)} ETH</td>
                                        <td>
                                            {myOffer && offerId !== undefined && offerId !== null ? (
                                                <button
                                                    className="cancel-offer-button"
                                                    onClick={() => handleCancelOffer(offerId)}
                                                    disabled={isCancelling}
                                                >
                                                    {isCancelling ? (isCancelPending ? 'Cancelling...' : 'Confirming...') : 'Cancel'}
                                                </button>
                                            ) : (!myOffer && offerId !== undefined && offerId !== null && connectedAddress) ? (
                                                <button
                                                    className="fulfill-offer-button"
                                                    onClick={() => handleFulfillOfferClick(offerId, offer.buyer, offer.price)}
                                                    disabled={!!fulfillingOffer}
                                                >
                                                    Fulfill Offer
                                                </button>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="offers-info">
                    <p>Total offers created: {currentOffers?.toString()}</p>
                    <button onClick={() => { refetchCount(); refetch(); }}>
                        Refresh
                    </button>
                </div>
            </fieldset>

            {/* Fulfillment Form */}
            {fulfillingOffer && (
                <fieldset className="terminal-fieldset">
                    <legend>Fulfill Offer #{fulfillingOffer.offerId.toString()}</legend>

                    <div className="fulfillment-info">
                        <p><strong>Buyer:</strong> {formatAddress(fulfillingOffer.buyerAddress)}</p>
                        <p><strong>Price:</strong> {parseFloat(formatEther(fulfillingOffer.price)).toFixed(4)} ETH</p>
                    </div>

                    <div className="fulfillment-form">
                        <div className="form-group">
                            <label htmlFor="token-id-sell">Select Token ID to Sell:</label>

                            {isLoadingTokens && <p>Loading your tokens...</p>}

                            {tokenError && <p className="error">Error loading tokens: {tokenError.message}</p>}

                            {!isLoadingTokens && !tokenError && displayTokens.length === 0 && (
                                <p>No tokens found in your wallet</p>
                            )}

                            {!isLoadingTokens && !tokenError && displayTokens.length > 0 && (
                                <div className="token-selection">
                                    {displayTokens.map((tokenId) => (
                                        <button
                                            key={tokenId.toString()}
                                            className={`token-option ${tokenIdToSell === tokenId.toString() ? 'selected' : ''}`}
                                            onClick={() => handleTokenSelect(tokenId.toString())}
                                        >
                                            Token #{tokenId.toString()}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <input
                                type="number"
                                id="token-id-sell"
                                placeholder="Or enter Token ID manually"
                                value={tokenIdToSell}
                                onChange={(e) => setTokenIdToSell(e.target.value)}
                                min="0"
                            />
                        </div>

                        <div className="button-group">
                            {/* Show Approve button if not approved */}
                            {!isApproved && tokenIdToSell && (
                                <button
                                    className="approve-button"
                                    onClick={handleApprove}
                                    disabled={isApprovePending}
                                >
                                    {isApprovePending ? 'Approving...' : 'Approve NFT'}
                                </button>
                            )}

                            {/* Show Fulfill button only if approved */}
                            <button
                                className="proceed-button"
                                onClick={async () => {
                                    if (!tokenIdToSell) {
                                        addMessage("Please select a token ID", "error");
                                        return;
                                    }

                                    if (!generatedProof) {
                                        addMessage("Proof not generated yet. Please wait...", "error");
                                        return;
                                    }

                                    if (!fulfillingOffer) {
                                        addMessage("No offer selected", "error");
                                        return;
                                    }

                                    addMessage(`Fulfilling offer #${fulfillingOffer.offerId}...`, "info");

                                    await fulfillOffer(
                                        fulfillingOffer.offerId,
                                        connectedAddress!,
                                        fulfillingOffer.buyerAddress,
                                        BigInt(tokenIdToSell),
                                        generatedProof.calldata
                                    );
                                }}
                                disabled={!isApproved || !tokenIdToSell || !generatedProof || transactionStatus !== 'ready' || isFulfillPending || isFulfillConfirming}
                            >
                                {transactionStatus === 'preparing' ? 'Generating Proof...' :
                                    isFulfillPending ? 'Submitting...' :
                                        isFulfillConfirming ? 'Confirming...' :
                                            transactionStatus === 'ready' ? 'Fulfill Offer' :
                                                'Generate Proof & Fulfill'}
                            </button>
                            <button
                                className="cancel-button"
                                onClick={handleCancelFulfillment}
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Transaction Status Display */}
                        {(transactionStatus !== 'idle' || isFulfillPending || isFulfillConfirming || !isApproved) && (
                            <div className="transaction-status">
                                {!isApproved && tokenIdToSell && transactionStatus === 'ready' && (
                                    <p className="warning">⚠ Marketplace needs approval to transfer your NFT. Click "Approve NFT" first.</p>
                                )}
                                {transactionStatus === 'preparing' && <p>Generating proof...</p>}
                                {transactionStatus === 'ready' && isApproved && !isFulfillPending && !isFulfillConfirming && (
                                    <p className="success">✓ Proof ready! Click "Fulfill Offer" to complete the sale.</p>
                                )}
                                {isFulfillPending && <p>Submitting transaction...</p>}
                                {isFulfillConfirming && <p>Confirming on blockchain...</p>}
                                {fulfillTxHash && <p>Transaction Hash: {fulfillTxHash}</p>}
                            </div>
                        )}

                        <div className="fulfillment-note">
                            <p><strong>Note:</strong> This will generate a ZK proof to re-encrypt the NFT data for the buyer and complete the sale.</p>
                        </div>
                    </div>
                </fieldset>
            )}
        </div>
    );
};

export default OffersList;
