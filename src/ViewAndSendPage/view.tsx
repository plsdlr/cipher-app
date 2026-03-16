import React, { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useReadContract, useAccount } from 'wagmi';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi.ts';
import CipherWrapperIframe, { CipherWrapperHandle } from '../canvasWrapper';
import { useDecryptToken } from './useDecryptToken.ts';
import { WalletConnectionWarning } from '../components';

type TokenParams = {
    tokenId?: string;
};

const ViewPage = () => {
    const { tokenId } = useParams<TokenParams>();
    const { isConnected } = useAccount();
    const cipherRef = useRef<CipherWrapperHandle>(null);

    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
    const formattedAddress = contractAddress as `0x${string}`;

    // Fetch encrypted data from the blockchain
    const { isLoading: isLoadingContract, error: contractError } = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'getEncryptedNote',
        args: [tokenId],
        query: {
            enabled: !!tokenId && isConnected
        }
    });


    const { data: decryptedToken, isLoading: isDecrypting, error: decryptError } = useDecryptToken(tokenId ?? null);

    // Check wallet connection first
    if (!isConnected) {
        return (
            <div>
                <fieldset className="terminal-fieldset">
                    <legend>View Token</legend>
                    <WalletConnectionWarning message="Please connect your Ethereum wallet to view this token." />
                </fieldset>
            </div>
        );
    }

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
                                ref={cipherRef}
                                coordinates={decryptedToken.decryptedData.positions}
                                builderTurmites={decryptedToken.decryptedData.rules.slice(0, 3)}
                                walkerTurmites={[decryptedToken.decryptedData.rules[3]]}
                                speed={1}
                                chaosNumbers={[
                                    decryptedToken.decryptedData.additionalValues.value1,
                                    decryptedToken.decryptedData.additionalValues.value2,
                                    decryptedToken.decryptedData.additionalValues.value3
                                ]}
                                color={decryptedToken.decryptedData.color - 1}  // Convert from 1-16 to 0-15 for UI
                            />
                            <div className="canvas-controls">
                                <button onClick={() => cipherRef.current?.toggleFullscreen()}>FULLSCREEN</button>
                                <button onClick={() => cipherRef.current?.exportSVG()}>EXPORT SVG</button>
                                <button onClick={() => {
                                    const [s1, s2, s3] = decryptedToken.decryptedData.rawDecryption;
                                    const snippet = `var slot1Encoded=${s1.toString()}n,slot2Encoded=${s2.toString()}n,slot3Encoded=${s3.toString()}n;`;
                                    navigator.clipboard.writeText(snippet).then(() => alert('Copied to clipboard!')).catch(() => {
                                        const ta = document.createElement('textarea');
                                        ta.value = snippet;
                                        document.body.appendChild(ta);
                                        ta.select();
                                        document.execCommand('copy');
                                        document.body.removeChild(ta);
                                        alert('Copied to clipboard!');
                                    });
                                }}>DEBUG EXPORT SLOTS</button>
                            </div>
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
                                        {decryptedToken.decryptedData.positions.map((position: { x: number; y: number }, index: number) => (
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
                                            <td>{decryptedToken.usedEncryptionKey?.[0]?.toString() ?? 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td>Encryption Key 2</td>
                                            <td>{decryptedToken.usedEncryptionKey?.[1]?.toString() ?? 'N/A'}</td>
                                        </tr>

                                        {/* Last Owner Public Keys */}
                                        <tr>
                                            <td>Last Owner Public Key 1</td>
                                            <td>{decryptedToken.lastOwnerPubKeys?.[0]?.toString() ?? 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td>Last Owner Public Key 2</td>
                                            <td>{decryptedToken.lastOwnerPubKeys?.[1]?.toString() ?? 'N/A'}</td>
                                        </tr>

                                        {/* Animation Parameters */}
                                        <tr>
                                            <td>Color Palette</td>
                                            <td>{decryptedToken.decryptedData.color}</td>
                                        </tr>
                                        <tr>
                                            <td>Pusher Slowness</td>
                                            <td>{decryptedToken.decryptedData.additionalValues.value1}</td>
                                        </tr>
                                        <tr>
                                            <td>Cleaner Slowness</td>
                                            <td>{decryptedToken.decryptedData.additionalValues.value2}</td>
                                        </tr>
                                        <tr>
                                            <td>Rectangle Count</td>
                                            <td>{decryptedToken.decryptedData.additionalValues.value3}</td>
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