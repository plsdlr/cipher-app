import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CipherWrapperIframe from '../canvasWrapper.tsx';
import { useDecryptToken } from '../ViewAndSendPage/useDecryptToken.ts';
import { ConsoleProvider, ConsoleDisplay, useConsole } from '../console/ConsoleContext.tsx';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import { generateProofTurmite } from '../ProofSystem/ProofSystem.tsx'
import encodeAll from '../utils/encodingUtils.js';
import { decodeSlot1, decodeSlot2, decodeSlot3, timeStamp, toBigInts } from '../utils/encodingUtils.js';
import { ReCipherNFT } from './ReCipherConnector.tsx';

///to do: implement market in solidity + implement cipher function in solidity contract


// Define turmite gene constants (same as Mint.tsx)
const BUILDER_GENES = [
    "ff0800ff0201ff0800000001",
    "ff0801000200000800ff0800",
    "ff0201000201ff0400000000",
    "ff0201000801ff0000000000",
    "ff0201000800ff0000000801",
    "ff0001000001ff0801000000",
    "ff0001000201ff0000000800"
];

const WALKER_GENES = [
    "ff0000ff0801000000000200",
    "ff0000ff0801000201000000",
    "ff0000ff0801000201000200",
    "ff0000ff0801ff0400000200",
    "ff0001000200000200000200",
    "ff0001000200000200ff0000",
    "ff0001000801ff0000ff0200",
    "ff0001ff0201ff0000ff0800"
];

// Color palette names for dropdown display
const COLOR_NAMES = [
    "Red", "Blue", "Purple", "Lime", "Brown", "Gray1", "Gray2", "White",
    "Red Blood", "Orange", "Yellow", "Green", "Blue2", "Lavender", "Pink", "Peach"
];

type TokenParams = {
    tokenId?: string;
};

const EditTokenPage = () => {
    const { tokenId } = useParams<TokenParams>();
    const { addMessage } = useConsole();

    // Get decrypted token data
    const { data: decryptedToken, isLoading: isDecrypting, error: decryptError } = useDecryptToken(tokenId);

    // State for editable values (same structure as Mint.tsx)
    const [coordinates, setCoordinates] = useState<{ x: number, y: number }[]>([]);
    const [builderGenes, setBuilderGenes] = useState<string[]>([]);
    const [walkerGene, setWalkerGene] = useState<string>('');
    const [color, setColor] = useState<number>(0);
    const [chaosNumbers, setChaosNumbers] = useState<number[]>([0, 0, 0]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [proofCalldata, setProofCalldata] = useState(null);

    const {
        publicKey,
        privateKey,
        generateEncryptionKey,
        poseidonEncryption,
        secretScalar
    } = useWallet();

    // Load data from decrypted token when available
    useEffect(() => {
        if (decryptedToken && decryptedToken.decryptedData && !isDataLoaded) {
            // Set coordinates from decrypted data
            setCoordinates(decryptedToken.decryptedData.positions || []);

            // Set genes from decrypted data
            const rules = decryptedToken.decryptedData.rules || [];
            setBuilderGenes(rules.slice(0, 3)); // First 3 are builders
            setWalkerGene(rules[3] || WALKER_GENES[0]); // 4th is walker

            // Set color and chaos numbers
            const additionalValues = decryptedToken.decryptedData.additionalValues || [0, 0, 0];
            setChaosNumbers(additionalValues);
            setColor(additionalValues[1] || 0);

            setIsDataLoaded(true);
            addMessage(`Loaded token #${tokenId} data for editing`, "info");
        }
    }, [decryptedToken, isDataLoaded, tokenId, addMessage]);

    // Handle coordinate input changes
    const handleCoordinateChange = (index: number, axis: 'x' | 'y', value: string) => {
        const newCoordinates = [...coordinates];
        const numValue = parseInt(value) || 0;
        const boundedValue = Math.min(Math.max(numValue, 0), 256);

        addMessage(`Coordinate change: Turmite ${index + 1} ${axis.toUpperCase()} = ${boundedValue}`, "info");

        newCoordinates[index] = {
            ...newCoordinates[index],
            [axis]: boundedValue
        };

        setCoordinates(newCoordinates);
    };

    // Handle color selection change
    const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedColor = parseInt(e.target.value);
        setChaosNumbers(prev => [prev[0], selectedColor, prev[2]]);
        setColor(selectedColor);
        addMessage(`Color changed to: ${COLOR_NAMES[selectedColor]}`, "info");
    };

    // Handle builder gene selection
    const handleBuilderGeneChange = (index: number, gene: string) => {
        const newBuilderGenes = [...builderGenes];
        newBuilderGenes[index] = gene;
        setBuilderGenes(newBuilderGenes);
        addMessage(`Builder gene ${index + 1} changed to: ${gene}`, "info");
    };

    // Handle walker gene selection
    const handleWalkerGeneChange = (gene: string) => {
        setWalkerGene(gene);
        addMessage(`Walker gene changed to: ${gene}`, "info");
    };

    // Generate random coordinates
    const generateRandomCoordinates = () => {
        const newCoords = Array(20).fill(null).map(() => ({
            x: Math.floor(Math.random() * 256),
            y: Math.floor(Math.random() * 256)
        }));
        setCoordinates(newCoords);
        addMessage("Generated random coordinates", "info");
    };

    // Reset to original token data
    const resetToOriginal = () => {
        if (decryptedToken && decryptedToken.decryptedData) {
            setCoordinates(decryptedToken.decryptedData.positions || []);
            const rules = decryptedToken.decryptedData.rules || [];
            setBuilderGenes(rules.slice(0, 3));
            setWalkerGene(rules[3] || WALKER_GENES[0]);
            const additionalValues = decryptedToken.decryptedData.additionalValues || [0, 0, 0];
            setChaosNumbers(additionalValues);
            setColor(additionalValues[1] || 0);
            addMessage("Reset to original token data", "info");
        }
    };



    const handleGenerateProof = async () => {
        if (publicKey && privateKey && secretScalar) {
            var allRules = builderGenes.concat(walkerGene)
            const encoded = toBigInts(encodeAll(coordinates, allRules, chaosNumbers));
            // console.log(encoded)
            const newEncryptionKey = generateEncryptionKey();
            const currentTimestamp = timeStamp()
            const cipherText = poseidonEncryption(currentTimestamp, newEncryptionKey, encoded);
            // console.log(cipherText)
            console.log(publicKey[0]);
            console.log(typeof (publicKey));

            // Include color in the proof generation
            const proof = await generateProofTurmite(privateKey, publicKey, encoded, secretScalar, cipherText, newEncryptionKey, currentTimestamp);
            setProofCalldata(proof.calldata);
        } else {
            console.log("not registerd")
        }
    }

    // Render loading state
    if (isDecrypting) {
        return <div>Loading and decrypting token #{tokenId}...</div>;
    }

    // Render error state
    if (decryptError) {
        return <div style={{ color: 'red' }}>Error decrypting token: {decryptError}</div>;
    }

    // Render no data state
    if (!decryptedToken) {
        return <div>No token data available</div>;
    }

    return (
        <div className="mint-page">
            <div className="mint-content">
                <fieldset className="terminal-fieldset">
                    <legend>EDIT TOKEN #{tokenId}</legend>
                    <div className="terminal-content">
                        <p>Modify the parameters of your existing Cipher NFT</p>
                        <div style={{ marginBottom: '10px' }}>
                            <button onClick={resetToOriginal} style={{ marginRight: '10px' }}>
                                RESET TO ORIGINAL
                            </button>
                            <button onClick={generateRandomCoordinates}>
                                RANDOMIZE COORDINATES
                            </button>
                        </div>
                    </div>
                </fieldset>

                <div className="mint-grid">
                    <fieldset className="terminal-fieldset">
                        <legend>PREVIEW</legend>
                        <CipherWrapperIframe
                            coordinates={coordinates}
                            builderTurmites={builderGenes}
                            walkerTurmites={[walkerGene]}
                            speed={1}
                            chaosNumbers={chaosNumbers}
                        />
                    </fieldset>

                    <fieldset className="terminal-fieldset">
                        <legend>TURMITE GENES</legend>

                        {/* Color Selection Dropdown */}
                        <div className="gene-section">
                            <p>Select Color Theme</p>
                            <div className="color-dropdown">
                                <select
                                    value={color}
                                    onChange={handleColorChange}
                                    className="color-select"
                                >
                                    {COLOR_NAMES.map((name, index) => (
                                        <option key={index} value={index}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="gene-section">
                            <fieldset className="terminal-fieldset">
                                <legend>BUILDER TURMITES (3 TYPES)</legend>
                                {builderGenes.map((gene, index) => (
                                    <div key={`builder-${index}`} className="gene-selector">
                                        <p>Builder {index + 1}</p>
                                        <div className="gene-options">
                                            {BUILDER_GENES.map((option, optionIndex) => (
                                                <label key={`builder-${index}-option-${optionIndex}`} className="gene-option">
                                                    <input
                                                        type="radio"
                                                        name={`builder-${index}`}
                                                        checked={gene === option}
                                                        onChange={() => handleBuilderGeneChange(index, option)}
                                                    />
                                                    <span className="gene-name">Type {optionIndex + 1}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </fieldset>
                        </div>

                        <div className="gene-section">
                            <fieldset className="terminal-fieldset">
                                <legend>WALKER TURMITES</legend>
                                <div className="gene-selector">
                                    <p>Walker Gene</p>
                                    <div className="gene-options">
                                        {WALKER_GENES.map((option, optionIndex) => (
                                            <label key={`walker-option-${optionIndex}`} className="gene-option">
                                                <input
                                                    type="radio"
                                                    name="walker-gene"
                                                    checked={walkerGene === option}
                                                    onChange={() => handleWalkerGeneChange(option)}
                                                />
                                                <span className="gene-name">Type {optionIndex + 1}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </fieldset>
                        </div>
                    </fieldset>

                    <fieldset className="terminal-fieldset">
                        <legend>TURMITE COORDINATES</legend>
                        <div className="coordinates-list">
                            {coordinates.slice(0, 20).map((coord, index) => (
                                <div key={index} className="coordinate-item">
                                    <span className="coordinate-label">Turmite {index + 1}:</span>
                                    <div className="coordinate-inputs">
                                        <input
                                            type="number"
                                            min="0"
                                            max="256"
                                            value={coord.x}
                                            onChange={(e) => handleCoordinateChange(index, 'x', e.target.value)}
                                            placeholder="X"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="256"
                                            value={coord.y}
                                            onChange={(e) => handleCoordinateChange(index, 'y', e.target.value)}
                                            placeholder="Y"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="terminal-fieldset">
                        <legend>ACTIONS</legend>
                        <div className="encryption-section">
                            <h3>Encrypt & Mint</h3>
                            <button onClick={handleGenerateProof}>Generate Poof</button>
                            {proofCalldata ?
                                <div>
                                    <div className="input-note">
                                        Proof Generated! Public Inputs:
                                        <br></br>
                                        {proofCalldata["publivInput"][0].substr(0, 7)}...
                                        <br></br>
                                        {proofCalldata["publivInput"][1].substr(0, 7)}...
                                        <br></br>
                                        {proofCalldata["publivInput"][2].substr(0, 7)}...
                                        <br></br>
                                        {proofCalldata["publivInput"][3].substr(0, 7)}...
                                        <br></br>
                                        {proofCalldata["publivInput"][4].substr(0, 7)}...
                                    </div>
                                    <ReCipherNFT calldata={proofCalldata} tokenId={tokenId || ''} />
                                </div>
                                : ""}

                        </div>
                    </fieldset>
                </div>
            </div>
        </div>
    );
};

export default EditTokenPage;
