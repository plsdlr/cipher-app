import React, { useEffect } from 'react';
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

    // useEffect(() => {
    //     console.log()
    // }) 

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
            <fieldset className="terminal-fieldset">
                <legend>View Token</legend>
                <h1>Cipher #{tokenId}</h1>

                {decryptedToken ? (
                    <div>
                        <div className='view-token'>

                            <CipherWrapperIframe
                                coordinates={decryptedToken.decryptedData.positions}
                                builderTurmites={decryptedToken.decryptedData.rules.slice(0, 3)}
                                walkerTurmites={[decryptedToken.decryptedData.rules[3]]}
                                speed={1}
                                chaosNumbers={decryptedToken.decryptedData.additionalValues}
                            />
                        </div>

                        <fieldset className="terminal-fieldset">
                            <legend>Cipher Details</legend>
                            <div className="Cipher-Details">
                                <p>Color Palette: {decryptedToken.decryptedData.additionalValues[1]}</p>
                                <p>Walker Rule: {decryptedToken.decryptedData.rules[3]}</p>
                                <p>Builder Rule: {decryptedToken.decryptedData.rules[0]},
                                    {decryptedToken.decryptedData.rules[1]},
                                    {decryptedToken.decryptedData.rules[2]}
                                </p>

                            </div>
                        </fieldset>
                    </div>
                ) : (
                    <div>No data available</div>
                )
                }
            </fieldset >
        </div >
    );
};

export default ViewPage;