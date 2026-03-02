import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi.ts';
import { useAccount, useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt, useConfig } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { useDecryptToken } from './useDecryptToken.ts'
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import { generateProofTransfer } from '../ProofSystem/ProofSystem.tsx'
import { timeStamp } from '../utils/encodingUtils.js';
import { TransactionStatus, TransactionButton, ProofGenerator, WalletConnectionWarning, RequireWallets } from '../components';


// Helper function to validate Ethereum address
const isValidEthAddress = (address: string): boolean => {
    // Basic format check: starts with 0x and has 42 characters total
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
};

const ViewList = () => {

    const {
        data: hash,
        error: writeError,
        isPending: isWritePending,
        writeContract
    } = useWriteContract()

    // Hook to wait for transaction confirmation
    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed
    } = useWaitForTransactionReceipt({
        hash,
    })


    const navigate = useNavigate();
    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
    const formattedAddress = contractAddress as `0x${string}`;
    const { address } = useAccount();
    const config = useConfig();
    const {
        publicKey,
        privateKey,
        secretScalar,
        genEcdhSharedKey,
        poseidonEncryption,
    } = useWallet();

    // State to track which token's send form is open
    const [selectedTokenForSend, setSelectedTokenForSend] = useState<string | null>(null);
    // State to store the receiver address
    const [receiverAddress, setReceiverAddress] = useState('');
    // State for address validation
    const [addressError, setAddressError] = useState<string | null>(null);
    // State to control when to fetch public keys
    const [shouldFetchKeys, setShouldFetchKeys] = useState(false);
    // State to store the calculated encryption key
    const [calculatedEncryptionKey, setCalculatedEncryptionKey] = useState<any>(null);

    // Fetch tokens owned by the user
    const {
        data: tokenIds,
        isLoading: isLoadingTokens,
        error: tokensError,
        refetch: refetchTokens
    } = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'returnTokenIdsOfOwner',
        args: ["0", "200", address],
        query: {
            enabled: !!address
        }
    });

    // Use our custom hook at the component level
    const { data: decryptedToken } = useDecryptToken(selectedTokenForSend);

    // Prepare tokenList
    const tokenList = (tokenIds as bigint[]) || [];

    // State for tracking registration check error
    const [registrationError, setRegistrationError] = useState<string | null>(null);
    const [recipherError, setRecipherError] = useState<string | null>(null);

    // Check if sender's public key is registered on-chain
    const { data: senderKeyRegistered } = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'userPublicKeys',
        args: [address as `0x${string}`, 0],
        query: {
            enabled: !!address
        }
    });

    // Fetch public keys for the receiver address (only when needed)
    const { data: newPublicKey, isLoading: isLoadingKeys, error: keyError } = useReadContracts({
        contracts: [
            {
                abi: EncryptedNFTABI,
                address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
                functionName: 'userPublicKeys',
                args: [receiverAddress as `0x${string}`, 0],
            },
            {
                abi: EncryptedNFTABI,
                address: EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`,
                functionName: 'userPublicKeys',
                args: [receiverAddress as `0x${string}`, 1],
            },
        ],
        query: {
            enabled: shouldFetchKeys && isValidEthAddress(receiverAddress), // Only fetch when we should and address is valid
        }
    });

    // Monitor transaction confirmation
    useEffect(() => {
        if (isConfirmed) {
            // Refetch the NFT list after successful transaction
            refetchTokens();

            // Auto-close form after successful transaction
            setTimeout(() => {
                handleCancelSend();
            }, 3000);
        }
    }, [isConfirmed, refetchTokens]);

    // Calculate shared ECDH key when we have the receiver's public key
    useEffect(() => {
        // Only proceed if we have valid data and we should be fetching keys
        if (newPublicKey && !isLoadingKeys && genEcdhSharedKey && shouldFetchKeys &&
            newPublicKey[0]?.result !== undefined && newPublicKey[1]?.result !== undefined &&
            !calculatedEncryptionKey) { // Don't recalculate if we already have a key

            // Extract the public key components from the contract results
            const toPublicKey: [bigint, bigint] = [
                newPublicKey[0].result as bigint,
                newPublicKey[1].result as bigint
            ];

            // Validate that we have non-zero public key values
            if (toPublicKey[0] === 0n && toPublicKey[1] === 0n) {
                setAddressError('Recipient has not registered their public key');
                return;
            }

            // Calculate the shared ECDH key
            const encryptionKey = genEcdhSharedKey(toPublicKey);
            setCalculatedEncryptionKey(encryptionKey);

            console.log('Calculated encryption key:', encryptionKey);
        }
    }, [newPublicKey, isLoadingKeys, genEcdhSharedKey, shouldFetchKeys, calculatedEncryptionKey]);


    // Navigate to token detail view
    const handleTokenClick = (tokenId: bigint) => {
        // Clear any errors when viewing a token
        setRegistrationError(null);
        setRecipherError(null);
        navigate(`/view/${tokenId}`);
    };

    const handleReCipher = async (e: React.MouseEvent, tokenId: bigint) => {
        e.stopPropagation(); // Prevent the row click event from firing
        setRecipherError(null); // Reset recipher error
        setRegistrationError(null); // Clear send error

        // Fetch the cipher flag for this specific token using contract call
        try {
            const cipherFlag = await readContract(config, {
                abi: EncryptedNFTABI,
                address: formattedAddress,
                functionName: 'getFlag',
                args: [tokenId],
            });

            console.log(`Token ${tokenId}: cipherFlag=${cipherFlag}`);

            // flag == true -> Poseidon Cipher with own keypair (cannot ReCipher)
            // flag == false -> Poseidon Cipher with ECDH with previous sender (can ReCipher)
            if (cipherFlag === true) {
                setRecipherError('⚠️ ReCipher only allowed once after transfer. This token is encrypted with your own keypair.');
                return; // Don't navigate
            }

            // Check passed, navigate to recipher page
            navigate(`/recipher/${tokenId}`);
        } catch (error) {
            console.error('Error checking cipher flag:', error);
            setRecipherError('⚠️ Error checking token status. Please try again.');
        }
    };

    // Handle showing the send form for a specific token
    const handleSendClick = async (e: React.MouseEvent, tokenId: bigint) => {
        e.stopPropagation(); // Prevent the row click event from firing

        // Check if sender is registered before opening send form
        setRegistrationError(null); // Reset registration error
        setRecipherError(null); // Clear recipher error

        try {
            // Check if user's public key is registered on-chain
            if (!senderKeyRegistered || senderKeyRegistered === 0n) {
                setRegistrationError('⚠️ You must register your Public Cipher Key before sending tokens. Please register your key in the cipher wallet on the right side ->.');
                return; // Don't open the form
            }

            console.log('Registration check passed - key is registered on-chain');

            // Registration check passed, open the send form
            setSelectedTokenForSend(tokenId.toString());
            setReceiverAddress(''); // Reset receiver address when opening a new form
            setAddressError(null); // Reset any previous errors
            setShouldFetchKeys(false); // Reset key fetching state
            setCalculatedEncryptionKey(null); // Reset calculated key
            setRegistrationError(null); // Clear any previous registration errors
        } catch (error) {
            console.error('Error checking registration:', error);
            setRegistrationError('⚠️ Error checking registration status. Please try again.');
        }
    };

    // Handle receiver address input change with validation
    const handleReceiverAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAddress = e.target.value;
        setReceiverAddress(newAddress);

        // Reset states when address changes
        setShouldFetchKeys(false);
        setCalculatedEncryptionKey(null);

        // Validate address format
        if (newAddress && !isValidEthAddress(newAddress)) {
            setAddressError('Invalid Ethereum address format');
        } else if (newAddress && isValidEthAddress(newAddress)) {
            setAddressError(null);
            // Trigger key fetching when we have a valid address
            setShouldFetchKeys(true);
        } else {
            setAddressError(null);
        }
    };


    // Cancel sending and close the form
    const handleCancelSend = () => {
        setSelectedTokenForSend(null);
        setReceiverAddress('');
        setAddressError(null);
        setShouldFetchKeys(false);
        setCalculatedEncryptionKey(null);
        setRegistrationError(null);
        setRecipherError(null);
    };

    // Check wallet connection first
    if (!address) {
        return (
            <fieldset className="terminal-fieldset">
                <legend>View / Send</legend>
                <WalletConnectionWarning message="Please connect your Ethereum wallet to view your NFTs." />
            </fieldset>
        );
    }

    // Loading state
    if (isLoadingTokens) {
        return <div>Loading user owned NFT's...</div>;
    }

    // Error state
    if (tokensError) {
        return <div>Error loading data: {tokensError.message}</div>;
    }

    return (
        <>
            <fieldset className="terminal-fieldset">
                <legend>View / Send</legend>
                <div className="view-list-container">

                    {tokenList.length === 0 ? (
                        <div className="no-tokens">
                            <p>You don't own any Turmite NFTs yet.</p>
                        </div>
                    ) : (
                        <>
                            <table className="token-table">
                                <thead>
                                    <tr>
                                        <th>Token ID</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tokenList.map((tokenId) => (
                                        <tr key={tokenId.toString()}>
                                            <td>CIPHER #{tokenId.toString()}</td>
                                            <td>
                                                <RequireWallets>
                                                    <button
                                                        className="view-btn"
                                                        onClick={() => handleTokenClick(tokenId)}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        className="send-btn"
                                                        onClick={(e) => handleSendClick(e, tokenId)}
                                                    >
                                                        Send
                                                    </button>
                                                    <button
                                                        className="send-btn"
                                                        onClick={(e) => handleReCipher(e, tokenId)}
                                                    >
                                                        ReCipher
                                                    </button>
                                                </RequireWallets>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Error Messages */}
                            {registrationError && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    border: '1px solid #ff0000',
                                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                    color: '#ff0000',
                                    borderRadius: '4px'
                                }}>
                                    {registrationError}
                                </div>
                            )}
                            {recipherError && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    border: '1px solid #ff0000',
                                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                    color: '#ff0000',
                                    borderRadius: '4px'
                                }}>
                                    {recipherError}
                                </div>
                            )}
                        </>
                    )}

                    <style>{`
                .error {
                    border-color: #ff0000;
                }
                
                .error-message {
                    color: #ff0000;
                    font-size: 12px;
                    margin-top: 5px;
                }
                
                .loading-message {
                    color: #ffaa00;
                    font-size: 12px;
                    margin-top: 5px;
                }
                
                .success-message {
                    color: #00ff00;
                    font-size: 12px;
                    margin-top: 5px;
                }
                
                .confirm-send-btn:disabled {
                    background-color: #666;
                    cursor: not-allowed;
                    opacity: 0.6;
                }

                .transaction-status {
                    display: flex;
                    align-items: center;
                    padding: 12px;
                    margin: 15px 0;
                    border-radius: 4px;
                    border: 1px solid;
                    font-size: 14px;
                }

                .transaction-status.preparing {
                    background-color: rgba(255, 170, 0, 0.1);
                    border-color: #ffaa00;
                    color: #ffaa00;
                }

                .transaction-status.pending {
                    background-color: rgba(0, 123, 255, 0.1);
                    border-color: #007bff;
                    color: #007bff;
                }

                .transaction-status.success {
                    background-color: rgba(0, 255, 0, 0.1);
                    border-color: #00ff00;
                    color: #00ff00;
                }

                .transaction-status.error {
                    background-color: rgba(255, 0, 0, 0.1);
                    border-color: #ff0000;
                    color: #ff0000;
                }

                .status-indicator {
                    margin-right: 8px;
                    min-width: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: currentColor;
                    animation: spin 1s ease-in-out infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .status-message {
                    flex: 1;
                }

                .transaction-hash {
                    margin-top: 8px;
                    font-size: 12px;
                }

                .hash-link {
                    color: inherit;
                    text-decoration: underline;
                }

                .hash-link:hover {
                    opacity: 0.8;
                }
            `}</style>
                </div>
            </fieldset >
            {/* Dynamic Send Form */}
            {selectedTokenForSend && (
                <div className='console-container'>
                    <fieldset className="terminal-fieldset">
                        <legend>Send Cipher</legend>
                        <div className="send-form-container">
                            <h3>Send CIPHER #{selectedTokenForSend}</h3>

                            <TransactionStatus
                                isPending={isWritePending}
                                isConfirming={isConfirming}
                                isSuccess={isConfirmed}
                                error={writeError?.message || null}
                                txHash={hash}
                                pendingMessage="Submitting transfer transaction..."
                                confirmingMessage="Waiting for blockchain confirmation..."
                                successMessage="NFT sent successfully!"
                            />

                            <div className="form-group">
                                <label htmlFor="receiver-address">Receiver Address:</label>
                                <input
                                    id="receiver-address"
                                    type="text"
                                    placeholder="0x..."
                                    value={receiverAddress}
                                    onChange={handleReceiverAddressChange}
                                    required
                                    className={addressError ? 'error' : ''}
                                    disabled={isWritePending}
                                />
                                {addressError && (
                                    <div className="error-message">{addressError}</div>
                                )}
                                {isLoadingKeys && (
                                    <div className="loading-message">Loading recipient's public key...</div>
                                )}
                                {keyError && (
                                    <div className="error-message">Error fetching recipient's public key</div>
                                )}
                                {calculatedEncryptionKey && (
                                    <div className="success-message">✓ Encryption key calculated</div>
                                )}
                            </div>

                            {calculatedEncryptionKey && decryptedToken && (
                                <RequireWallets>
                                    <ProofGenerator
                                        onGenerateProof={async () => {
                                            if (!publicKey || !privateKey || !secretScalar) {
                                                throw new Error("Wallet not registered. Please register your public key first.");
                                            }

                                            if (!decryptedToken.lastOwnerPubKeys || !decryptedToken.usedEncryptionKey ||
                                                !decryptedToken.decryptedData || !decryptedToken.encryptedNote) {
                                                throw new Error("Token data incomplete");
                                            }

                                            // Extract receiver's public key
                                            const toPublicKey: [bigint, bigint] = [
                                                newPublicKey![0].result as bigint,
                                                newPublicKey![1].result as bigint
                                            ];

                                            const currentTimestamp = timeStamp();
                                            const cipherText = poseidonEncryption(
                                                currentTimestamp,
                                                calculatedEncryptionKey,
                                                decryptedToken.decryptedData.rawDecryption
                                            );

                                            console.log('Generating transfer proof...');

                                            const proof = await generateProofTransfer(
                                                privateKey,
                                                secretScalar,
                                                publicKey,
                                                decryptedToken.lastOwnerPubKeys,
                                                toPublicKey,
                                                decryptedToken.usedEncryptionKey,
                                                calculatedEncryptionKey,
                                                decryptedToken.decryptedData.rawDecryption,
                                                decryptedToken.decryptedData.rawDecryption,
                                                (decryptedToken.encryptedNote.slice(0, 4) as bigint[]),
                                                cipherText,
                                                [decryptedToken.encryptedNote[4]],
                                                [currentTimestamp]
                                            );

                                            console.log('Transfer proof generated:', proof);
                                            return proof.calldata;
                                        }}
                                        autoGenerate={true}
                                        triggerDeps={[calculatedEncryptionKey, decryptedToken]}
                                        preparingMessage="Preparing transfer proof..."
                                        generatingMessage="Generating zero-knowledge proof for transfer..."
                                        readyMessage="Proof generated successfully! Ready to send."
                                    >
                                        {({ proofCalldata, status }) => (
                                            <div className="form-actions">
                                                <TransactionButton
                                                    onClick={() => {
                                                        if (proofCalldata) {
                                                            writeContract({
                                                                address: formattedAddress,
                                                                abi: EncryptedNFTABI,
                                                                functionName: 'verifiedTransferFrom',
                                                                args: [
                                                                    address,
                                                                    receiverAddress,
                                                                    selectedTokenForSend,
                                                                    proofCalldata.a,
                                                                    proofCalldata.b,
                                                                    proofCalldata.c,
                                                                    proofCalldata.publivInput
                                                                ],
                                                            });
                                                        }
                                                    }}
                                                    isPending={isWritePending}
                                                    isConfirming={isConfirming}
                                                    disabled={
                                                        !proofCalldata ||
                                                        status !== 'ready' ||
                                                        !!addressError ||
                                                        isLoadingKeys
                                                    }
                                                    className="confirm-send-btn"
                                                    idleText="Confirm Send"
                                                    pendingText="Submitting..."
                                                    confirmingText="Confirming..."
                                                />
                                                <button
                                                    type="button"
                                                    className="cancel-send-btn"
                                                    onClick={handleCancelSend}
                                                    disabled={isWritePending || isConfirming}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </ProofGenerator>
                                </RequireWallets>
                            )}
                        </div>
                    </fieldset>
                </div>
            )}
        </>

    );
};

export default ViewList;

