
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/contractAbi.ts';
import { useAccount, useReadContract } from 'wagmi';

const ViewList = () => {
    const navigate = useNavigate();
    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
    const formattedAddress = contractAddress as `0x${string}`;
    const { address } = useAccount();

    // State to track which token's send form is open
    const [selectedTokenForSend, setSelectedTokenForSend] = useState<string | null>(null);
    // State to store the receiver address
    const [receiverAddress, setReceiverAddress] = useState('');

    // Fetch tokens owned by the user
    const encryptedNotes = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'returnTokenIdsOfOwner',
        args: ["0", "200", address]
    });

    // Navigate to token detail view
    const handleTokenClick = (tokenId) => {
        navigate(`/view/${tokenId}`);
    };

    // Handle showing the send form for a specific token
    const handleSendClick = (e, tokenId) => {
        e.stopPropagation(); // Prevent the row click event from firing
        setSelectedTokenForSend(tokenId.toString());
        setReceiverAddress(''); // Reset receiver address when opening a new form
    };

    // Handle form submission (empty implementation as requested)
    const handleSendSubmit = (e) => {
        e.preventDefault();
        // Empty handler function as requested
        console.log(`Send token ${selectedTokenForSend} to ${receiverAddress}`);

        // Close the form after submission
        setSelectedTokenForSend(null);
        setReceiverAddress('');
    };

    // Cancel sending and close the form
    const handleCancelSend = () => {
        setSelectedTokenForSend(null);
        setReceiverAddress('');
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
                                        onChange={(e) => setReceiverAddress(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-actions">
                                    <button type="submit" className="confirm-send-btn">
                                        Confirm Send
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


        </div>
    );
};

export default ViewList;

