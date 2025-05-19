import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/contractAbi.ts';
import { useAccount, useReadContract, useReadContracts } from 'wagmi';
import { useDecryptToken } from './useDecryptToken.ts'
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import { generateProofTransfer } from '../ProofSystem/ProofSystem.tsx'

// Helper function to validate Ethereum address
const isValidEthAddress = (address: string): boolean => {
    // Basic format check: starts with 0x and has 42 characters total
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
};

const ViewList = () => {
    const navigate = useNavigate();
    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
    const formattedAddress = contractAddress as `0x${string}`;
    const { address } = useAccount();
    const {
        publicKey,
        privateKey,
        isGenerated,
        secretScalar,
        genEcdhSharedKey
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
    const encryptedNotes = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'returnTokenIdsOfOwner',
        args: ["0", "200", address]
    });

    // Use our custom hook at the component level
    const { data: decryptedToken, isLoading: isDecrypting, error: decryptError } = useDecryptToken(selectedTokenForSend);

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

    // Calculate shared ECDH key when we have the receiver's public key
    useEffect(() => {
        // Only proceed if we have valid data and we should be fetching keys
        if (newPublicKey && !isLoadingKeys && genEcdhSharedKey && shouldFetchKeys &&
            newPublicKey[0]?.result !== undefined && newPublicKey[1]?.result !== undefined &&
            !calculatedEncryptionKey) { // Don't recalculate if we already have a key
            try {
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

                // Now you can proceed with generating the proof transfer
                // if (decryptedToken && privateKey && secretScalar) {
                //     const generatedProof = generateProofTransfer(
                //         privateKey,
                //         secretScalar,
                //         decryptedToken?.lastOwnerAddress,
                //         toPublicKey,
                //         decryptedToken?.usedEncryptionKey,
                //         encryptionKey,
                //         decryptedToken?.decryptedData
                //     );
                //     console.log('Generated proof:', generatedProof);
                // }
            } catch (error) {
                console.error('Error calculating encryption key:', error);
                setAddressError('Error calculating encryption key');
            }
        }
    }, [newPublicKey, isLoadingKeys, shouldFetchKeys, calculatedEncryptionKey, decryptedToken, privateKey, secretScalar]);


    // Navigate to token detail view
    const handleTokenClick = (tokenId) => {
        navigate(`/view/${tokenId}`);
    };

    // Handle showing the send form for a specific token
    const handleSendClick = (e, tokenId) => {
        e.stopPropagation(); // Prevent the row click event from firing
        setSelectedTokenForSend(tokenId.toString());
        setReceiverAddress(''); // Reset receiver address when opening a new form
        setAddressError(null); // Reset any previous errors
        setShouldFetchKeys(false); // Reset key fetching state
        setCalculatedEncryptionKey(null); // Reset calculated key
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

    // Handle form submission
    const handleSendSubmit = (e) => {
        e.preventDefault();

        // Final validation before submission
        if (!isValidEthAddress(receiverAddress)) {
            setAddressError('Please enter a valid Ethereum address');
            return;
        }

        if (!calculatedEncryptionKey) {
            setAddressError('Encryption key not calculated. Please wait or try again.');
            return;
        }

        // Proceed with sending logic
        console.log(`Send token ${selectedTokenForSend} to ${receiverAddress}`);
        console.log('Using encryption key:', calculatedEncryptionKey);

        // Close the form after submission
        setSelectedTokenForSend(null);
        setReceiverAddress('');
        setAddressError(null);
        setShouldFetchKeys(false);
        setCalculatedEncryptionKey(null);
    };

    // Cancel sending and close the form
    const handleCancelSend = () => {
        setSelectedTokenForSend(null);
        setReceiverAddress('');
        setAddressError(null);
        setShouldFetchKeys(false);
        setCalculatedEncryptionKey(null);
    };

    // Loading state
    if (encryptedNotes.isLoading) {
        return <div>Loading user owned NFT's...</div>;
    }

    // Error state
    if (encryptedNotes.error) {
        return <div>Error loading data: {encryptedNotes.error.message}</div>;
    }

    // Format token data for display
    const tokenIds = encryptedNotes.data || [];

    return (
        <div className="view-list-container">
            <h1>VIEW PAGE</h1>

            {tokenIds.length === 0 ? (
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
                            {tokenIds.map((tokenId) => (
                                <tr
                                    key={tokenId.toString()}
                                    className="token-row"
                                    onClick={() => handleTokenClick(tokenId)}
                                >
                                    <td>CIPHER #{tokenId.toString()}</td>
                                    <td>
                                        <button className="view-btn">View</button>
                                        <button
                                            className="send-btn"
                                            onClick={(e) => handleSendClick(e, tokenId)}
                                        >
                                            Send
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Dynamic Send Form */}
                    {selectedTokenForSend && (
                        <div className="send-form-container">
                            <form className="send-form" onSubmit={handleSendSubmit}>
                                <h3>Send CIPHER #{selectedTokenForSend}</h3>
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
                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="confirm-send-btn"
                                        disabled={!calculatedEncryptionKey || !!addressError || isLoadingKeys}
                                    >
                                        {isLoadingKeys ? 'Loading...' : 'Confirm Send'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel-send-btn"
                                        onClick={handleCancelSend}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </>
            )}

            <style jsx>{`
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
            `}</style>
        </div>
    );
};

export default ViewList;
// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/contractAbi.ts';
// import { useAccount, useReadContract } from 'wagmi';
// // import { useSendToken } from './Sending.ts';
// import { useDecryptToken } from './useDecryptToken.ts'
// import { useWallet } from '../cipherWallet/cipherWallet.tsx';

// import { generateProofTransfer } from '../ProofSystem/ProofSystem.tsx'

// const ViewList = () => {
//     const navigate = useNavigate();
//     const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
//     const formattedAddress = contractAddress as `0x${string}`;
//     const { address } = useAccount();
//     const {
//         publicKey,
//         privateKey,
//         isGenerated,
//         secretScalar
//     } = useWallet();

//     // State to track which token's send form is open
//     const [selectedTokenForSend, setSelectedTokenForSend] = useState<string | null>(null);
//     // State to store the receiver address
//     const [receiverAddress, setReceiverAddress] = useState('');

//     // Fetch tokens owned by the user
//     const encryptedNotes = useReadContract({
//         abi: EncryptedNFTABI,
//         address: formattedAddress,
//         functionName: 'returnTokenIdsOfOwner',
//         args: ["0", "200", address]
//     });

//     // Use our custom hook at the component level
//     const { data: decryptedToken, isLoading: isDecrypting, error: decryptError } = useDecryptToken(selectedTokenForSend);


//     // Navigate to token detail view
//     const handleTokenClick = (tokenId) => {
//         navigate(`/view/${tokenId}`);
//     };

//     // Handle showing the send form for a specific token
//     const handleSendClick = (e, tokenId) => {
//         e.stopPropagation(); // Prevent the row click event from firing
//         setSelectedTokenForSend(tokenId.toString());
//         setReceiverAddress(''); // Reset receiver address when opening a new form
//         const placeholderPublicKey = [0n, 0n];
//         const placeholderEncryptionKey = [0n, 0n];

//         // const generatedProof = generateProofTransfer(privateKey,
//         //     secretScalar,
//         //     decryptedToken?.lastOwnerAddress,
//         //     placeholderPublicKey,
//         //     decryptedToken?.usedEncryptionKey,
//         //     placeholderEncryptionKey,
//         //     decryptedToken?.decryptedData,

//         // )
//         //prepareTokenSend(tokenId.toString());
//     };

//     // Handle form submission (empty implementation as requested)
//     const handleSendSubmit = (e) => {
//         e.preventDefault();
//         // Empty handler function as requested
//         console.log(`Send token ${selectedTokenForSend} to ${receiverAddress}`);

//         // Close the form after submission
//         setSelectedTokenForSend(null);
//         setReceiverAddress('');
//     };

//     // Cancel sending and close the form
//     const handleCancelSend = () => {
//         setSelectedTokenForSend(null);
//         setReceiverAddress('');
//     };

//     // Loading state
//     if (encryptedNotes.isLoading) {
//         return <div>Loading user owned NFT's...</div>;
//     }

//     // Error state
//     if (encryptedNotes.error) {
//         return <div>Error loading data: {encryptedNotes.error.message}</div>;
//     }

//     // Format token data for display
//     const tokenIds = encryptedNotes.data || [];


//     // useEffect(() => {
//     //     console.log("decrypted here:")
//     //     console.log(decryptedToken)
//     // }, []);

//     return (
//         <div className="view-list-container">
//             <h1>VIEW PAGE</h1>

//             {tokenIds.length === 0 ? (
//                 <div className="no-tokens">
//                     <p>You don't own any Turmite NFTs yet.</p>
//                 </div>
//             ) : (
//                 <>
//                     <table className="token-table">
//                         <thead>
//                             <tr>
//                                 <th>Token ID</th>
//                                 <th>Actions</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {tokenIds.map((tokenId) => (
//                                 <tr
//                                     key={tokenId.toString()}
//                                     className="token-row"
//                                     onClick={() => handleTokenClick(tokenId)}
//                                 >
//                                     <td>CIPHER #{tokenId.toString()}</td>
//                                     <td>
//                                         <button className="view-btn">View</button>
//                                         <button
//                                             className="send-btn"
//                                             onClick={(e) => handleSendClick(e, tokenId)}
//                                         >
//                                             Send
//                                         </button>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>

//                     {/* Dynamic Send Form */}
//                     {selectedTokenForSend && (
//                         <div className="send-form-container">
//                             <form className="send-form" onSubmit={handleSendSubmit}>
//                                 <h3>Send CIPHER #{selectedTokenForSend}</h3>
//                                 <div className="form-group">
//                                     <label htmlFor="receiver-address">Receiver Address:</label>
//                                     <input
//                                         id="receiver-address"
//                                         type="text"
//                                         placeholder="0x..."
//                                         value={receiverAddress}
//                                         onChange={(e) => setReceiverAddress(e.target.value)}
//                                         required
//                                     />
//                                 </div>
//                                 <div className="form-actions">
//                                     <button type="submit" className="confirm-send-btn">
//                                         Confirm Send
//                                     </button>
//                                     <button
//                                         type="button"
//                                         className="cancel-send-btn"
//                                         onClick={handleCancelSend}
//                                     >
//                                         Cancel
//                                     </button>
//                                 </div>
//                             </form>
//                         </div>
//                     )}
//                 </>
//             )}


//         </div>
//     );
// };

// export default ViewList;

