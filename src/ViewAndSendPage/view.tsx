import React from 'react';
import { useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/contractAbi.ts';
import CipherWrapperIframe from '../canvasWrapper';
import { useDecryptToken } from './useDecryptToken.ts'

type TokenParams = {
    tokenId?: string;
};

const ViewPage = () => {
    const { tokenId } = useParams<TokenParams>();

    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
    const formattedAddress = contractAddress as `0x${string}`;

    // Fetch encrypted data from the blockchain
    const { data: encryptedNote, isLoading: isLoadingContract, error: contractError } = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'getEncryptedNote',
        args: [tokenId]
    });

    // Use our custom hook to decrypt the data
    // const { data: decryptedData, isLoading: isDecrypting, error: decryptError } = useDecryptTurmite(
    //     encryptedNote as [bigint, bigint, bigint, bigint, bigint]
    // );

    const { data: decryptedToken, isLoading: isDecrypting, error: decryptError } = useDecryptToken(tokenId);

    // Render loading state
    if (isLoadingContract || isDecrypting) {
        return <div>Loading {isLoadingContract ? 'encrypted data' : 'decrypting data'}...</div>;
    }

    // Render contract error
    if (contractError) {
        return <div>Error loading data: {contractError.message}</div>;
    }

    // Render decryption error
    if (decryptError) {
        return <div style={{ color: 'red' }}>Error decrypting: {decryptError}</div>;
    }

    return (
        <div>
            <h1>VIEW PAGE</h1>
            Cipher #{tokenId}

            {decryptedToken ? (
                <div>
                    <CipherWrapperIframe
                        coordinates={decryptedToken.decryptedData.positions}
                        builderTurmites={decryptedToken.decryptedData.rules.slice(0, 3)}
                        walkerTurmites={[decryptedToken.decryptedData.rules[3]]}
                        speed={1}
                        chaosNumbers={decryptedToken.decryptedData.additionalValues}
                    />

                    <div className="turmite-details">
                        <h3>Turmite Details</h3>
                        <p>Color Palette: {decryptedToken.decryptedData.additionalValues[1]}</p>
                        <p>Chaos Factor: {decryptedToken.decryptedData.additionalValues[0]}</p>
                    </div>
                </div>
            ) : (
                <div>No data available</div>
            )}
        </div>
    );
};

export default ViewPage;