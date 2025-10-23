import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi.ts';
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


    const { data: decryptedToken, isLoading: isDecrypting, error: decryptError } = useDecryptToken(tokenId);

    useEffect(() => {
        if (decryptedToken) {
            console.log(JSON.stringify(decryptedToken, (key, value) => {
                return typeof value === 'bigint' ? value.toString() : value;
            }, 2))
        }
    }, [decryptedToken]);

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


                                <table className="token-table">
                                    <thead>
                                        <tr>
                                            <th>Attributes</th>
                                            <th>Values</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Basic Token Info */}
                                        <tr>
                                            <td>Token ID</td>
                                            <td>{decryptedToken.tokenId}</td>
                                        </tr>
                                        <tr>
                                            <td>Cipher Flag</td>
                                            <td>{decryptedToken.cipherFlag ? 'true' : 'false'}</td>
                                        </tr>
                                        <tr>
                                            <td>Last Owner Address</td>
                                            <td>{decryptedToken.lastOwnerAddress}</td>
                                        </tr>



                                        {/* Rules */}
                                        <tr>
                                            <td>Rule 1</td>
                                            <td>{decryptedToken.decryptedData.rules[0]}</td>
                                        </tr>
                                        <tr>
                                            <td>Rule 2</td>
                                            <td>{decryptedToken.decryptedData.rules[1]}</td>
                                        </tr>
                                        <tr>
                                            <td>Rule 3</td>
                                            <td>{decryptedToken.decryptedData.rules[2]}</td>
                                        </tr>
                                        <tr>
                                            <td>Rule 4</td>
                                            <td>{decryptedToken.decryptedData.rules[3]}</td>
                                        </tr>


                                        {/* Positions - All 20 positions */}
                                        {decryptedToken.decryptedData.positions.map((position, index) => (
                                            <React.Fragment key={index}>
                                                <tr>
                                                    <td>Position {index + 1} X</td>
                                                    <td>{position.x}</td>
                                                </tr>
                                                <tr>
                                                    <td>Position {index + 1} Y</td>
                                                    <td>{position.y}</td>
                                                </tr>
                                            </React.Fragment>
                                        ))}

                                        {/* Raw Decryption Values */}
                                        <tr>
                                            <td>Raw Decryption 1</td>
                                            <td>{decryptedToken.decryptedData.rawDecryption[0].toString()}</td>
                                        </tr>
                                        <tr>
                                            <td>Raw Decryption 2</td>
                                            <td>{decryptedToken.decryptedData.rawDecryption[1].toString()}</td>
                                        </tr>
                                        <tr>
                                            <td>Raw Decryption 3</td>
                                            <td>{decryptedToken.decryptedData.rawDecryption[2].toString()}</td>
                                        </tr>

                                        {/* Encrypted Note */}
                                        {decryptedToken.encryptedNote.map((note, index) => (
                                            <tr key={index}>
                                                <td>Encrypted Note {index + 1}</td>
                                                <td>{typeof note === 'boolean' ? note.toString() : note.toString()}</td>
                                            </tr>
                                        ))}

                                        {/* Encryption Keys */}
                                        <tr>
                                            <td>Encryption Key 1</td>
                                            <td>{decryptedToken.usedEncryptionKey[0].toString()}</td>
                                        </tr>
                                        <tr>
                                            <td>Encryption Key 2</td>
                                            <td>{decryptedToken.usedEncryptionKey[1].toString()}</td>
                                        </tr>

                                        {/* Last Owner Public Keys */}
                                        <tr>
                                            <td>Last Owner Public Key 1</td>
                                            <td>{decryptedToken.lastOwnerPubKeys[0].toString()}</td>
                                        </tr>
                                        <tr>
                                            <td>Last Owner Public Key 2</td>
                                            <td>{decryptedToken.lastOwnerPubKeys[1].toString()}</td>
                                        </tr>

                                        {/* Additional Values */}
                                        <tr>
                                            <td>Additional Value 1</td>
                                            <td>{decryptedToken.decryptedData.additionalValues[0]}</td>
                                        </tr>
                                        <tr>
                                            <td>Additional Value 2</td>
                                            <td>{decryptedToken.decryptedData.additionalValues[1]}</td>
                                        </tr>
                                        <tr>
                                            <td>Additional Value 3</td>
                                            <td>{decryptedToken.decryptedData.additionalValues[2]}</td>
                                        </tr>
                                    </tbody>
                                </table>



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