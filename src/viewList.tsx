import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from './contractAbi.ts';
import { useAccount, useReadContract } from 'wagmi';

const ViewList = () => {
    const navigate = useNavigate();
    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
    const formattedAddress = contractAddress as `0x${string}`;
    const { address } = useAccount();

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
                                <td><button className="view-btn">View</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ViewList;