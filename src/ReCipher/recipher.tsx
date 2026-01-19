import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import CipherWrapperIframe from '../canvasWrapper.tsx';
import { useDecryptToken } from '../ViewAndSendPage/useDecryptToken.ts';
import { useConsole } from '../console/ConsoleContext.tsx';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import { generateProofTurmite } from '../ProofSystem/ProofSystem.tsx'
import encodeAll from '../utils/encodingUtils.js';
import { timeStamp, toBigInts } from '../utils/encodingUtils.js';
import { ReCipherNFT } from './ReCipherConnector.tsx';
import { ProofGenerator, RequireWallets } from '../components';

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
    const [pusherFrames, setPusherFrames] = useState<number>(11);
    const [cleanerFrames, setCleanerFrames] = useState<number>(1);
    const [rectangleCount, setRectangleCount] = useState<number>(5);
    const [chaosNumbers, setChaosNumbers] = useState<number[]>([11, 1, 5]); // [pusherSlowness, cleanerSlowness, rectangleCount]
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // State to track original values
    const [originalValues, setOriginalValues] = useState<{
        coordinates: { x: number, y: number }[];
        builderGenes: string[];
        walkerGene: string;
        color: number;
        pusherFrames: number;
        cleanerFrames: number;
        rectangleCount: number;
    } | null>(null);

    // State to track if any parameter has been changed
    const [hasChanges, setHasChanges] = useState(false);
    // State to track which specific parameter was changed
    const [changedParameter, setChangedParameter] = useState<string | null>(null);

    const {
        publicKey,
        privateKey,
        generateEncryptionKey,
        genEcdhSharedKey,
        poseidonEncryption,
        secretScalar
    } = useWallet();

    // Load data from decrypted token when available
    useEffect(() => {
        if (decryptedToken && decryptedToken.decryptedData && !isDataLoaded) {
            // Set coordinates from decrypted data
            const loadedCoordinates = decryptedToken.decryptedData.positions || [];
            setCoordinates(loadedCoordinates);

            // Set genes from decrypted data
            const rules = decryptedToken.decryptedData.rules || [];
            const loadedBuilderGenes = rules.slice(0, 3); // First 3 are builders
            const loadedWalkerGene = rules[3] || WALKER_GENES[0]; // 4th is walker
            setBuilderGenes(loadedBuilderGenes);
            setWalkerGene(loadedWalkerGene);

            // Set color and animation parameters
            const additionalValues = decryptedToken.decryptedData.additionalValues || { value1: 11, value2: 1, value3: 5 };
            const decodedColor = decryptedToken.decryptedData.color || 1; // Color from new encoding (1-16)

            const loadedPusherFrames = additionalValues.value1 === 0 ? 11 : additionalValues.value1;
            const loadedCleanerFrames = additionalValues.value2 === 0 ? 1 : additionalValues.value2;
            const loadedRectangleCount = additionalValues.value3 || 5;
            const loadedColor = decodedColor - 1; // Convert from 1-16 to 0-15 for UI

            setPusherFrames(loadedPusherFrames);
            setCleanerFrames(loadedCleanerFrames);
            setRectangleCount(loadedRectangleCount);
            setChaosNumbers([additionalValues.value1, additionalValues.value2, additionalValues.value3]);
            setColor(loadedColor);

            // Store original values
            setOriginalValues({
                coordinates: JSON.parse(JSON.stringify(loadedCoordinates)), // Deep copy
                builderGenes: [...loadedBuilderGenes],
                walkerGene: loadedWalkerGene,
                color: loadedColor,
                pusherFrames: loadedPusherFrames,
                cleanerFrames: loadedCleanerFrames,
                rectangleCount: loadedRectangleCount
            });

            setIsDataLoaded(true);
            addMessage(`Loaded token #${tokenId} data for editing`, "info");
        }
    }, [decryptedToken, isDataLoaded, tokenId, addMessage]);

    // Check if any values have changed from original and identify which specific parameter
    useEffect(() => {
        if (!originalValues) return;

        // Check color
        if (color !== originalValues.color) {
            setHasChanges(true);
            setChangedParameter('color');
            return;
        }

        // Check animation parameters
        if (pusherFrames !== originalValues.pusherFrames) {
            setHasChanges(true);
            setChangedParameter('pusherFrames');
            return;
        }
        if (cleanerFrames !== originalValues.cleanerFrames) {
            setHasChanges(true);
            setChangedParameter('cleanerFrames');
            return;
        }
        if (rectangleCount !== originalValues.rectangleCount) {
            setHasChanges(true);
            setChangedParameter('rectangleCount');
            return;
        }

        // Check builder genes individually
        for (let i = 0; i < builderGenes.length; i++) {
            if (builderGenes[i] !== originalValues.builderGenes[i]) {
                setHasChanges(true);
                setChangedParameter(`builder-${i}`);
                return;
            }
        }

        // Check walker gene
        if (walkerGene !== originalValues.walkerGene) {
            setHasChanges(true);
            setChangedParameter('walker');
            return;
        }

        // Check coordinates individually
        for (let i = 0; i < coordinates.length; i++) {
            if (coordinates[i].x !== originalValues.coordinates[i].x) {
                setHasChanges(true);
                setChangedParameter(`coord-${i}-x`);
                return;
            }
            if (coordinates[i].y !== originalValues.coordinates[i].y) {
                setHasChanges(true);
                setChangedParameter(`coord-${i}-y`);
                return;
            }
        }

        // Nothing changed
        setHasChanges(false);
        setChangedParameter(null);
    }, [coordinates, builderGenes, walkerGene, color, pusherFrames, cleanerFrames, rectangleCount, originalValues]);

    // Reset to original values
    const resetChanges = () => {
        if (originalValues) {
            setCoordinates(JSON.parse(JSON.stringify(originalValues.coordinates)));
            setBuilderGenes([...originalValues.builderGenes]);
            setWalkerGene(originalValues.walkerGene);
            setColor(originalValues.color);
            setPusherFrames(originalValues.pusherFrames);
            setCleanerFrames(originalValues.cleanerFrames);
            setRectangleCount(originalValues.rectangleCount);
            setHasChanges(false);
            setChangedParameter(null);
            addMessage("Reset all changes to original values", "info");
        }
    };

    // Helper function to check if a specific parameter should be disabled
    const isParameterDisabled = (paramName: string): boolean => {
        if (!hasChanges || !changedParameter) return false;
        return changedParameter !== paramName;
    };

    // Handle coordinate input changes
    const handleCoordinateChange = (index: number, axis: 'x' | 'y', value: string) => {
        const newCoordinates = [...coordinates];
        // Allow empty string for editing, otherwise parse and bound the value
        let boundedValue: number;
        if (value === '' || value === '-') {
            boundedValue = 0;
        } else {
            const numValue = parseInt(value);
            boundedValue = Math.min(Math.max(numValue, 0), 256);
        }

        addMessage(`Coordinate change: Turmite ${index + 1} ${axis.toUpperCase()} = ${boundedValue}`, "info");

        newCoordinates[index] = {
            ...newCoordinates[index],
            [axis]: boundedValue
        };

        setCoordinates(newCoordinates);
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

    // Handle color selection change
    const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedColor = parseInt(e.target.value);
        setColor(selectedColor);
        addMessage(`Color changed to: ${COLOR_NAMES[selectedColor]}`, "info");
    };

    // Keep chaosNumbers synchronized with individual parameter changes
    useEffect(() => {
        setChaosNumbers([pusherFrames, cleanerFrames, rectangleCount]);
    }, [pusherFrames, cleanerFrames, rectangleCount]);

    // Handle animation parameter changes (matching Mint.tsx)
    const handlePusherChange = (value: number) => {
        setPusherFrames(value);
        addMessage(`Pusher slowness changed to: ${value}`, "info");
    };

    const handleCleanerChange = (value: number) => {
        setCleanerFrames(value);
        addMessage(`Cleaner slowness changed to: ${value}`, "info");
    };

    const handleRectangleChange = (value: number) => {
        setRectangleCount(value);
        addMessage(`Rectangle count changed to: ${value}`, "info");
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
                    <legend>RE-CIPHER TOKEN #{tokenId}</legend>
                    <div className="terminal-content">
                        <p>Modify the parameters of your Cipher NFT and re-encrypt it with your own keypair</p>
                        <p style={{ color: '#ffaa00', fontWeight: 'bold' }}>⚠️ You can only change ONE parameter per re-cipher operation</p>
                        {hasChanges && changedParameter && (
                            <div style={{
                                marginTop: '15px',
                                padding: '15px',
                                backgroundColor: 'rgba(255, 170, 0, 0.1)',
                                border: '2px solid #ffaa00',
                                borderRadius: '4px'
                            }}>
                                <p style={{ color: '#ffaa00', fontWeight: 'bold', marginBottom: '10px' }}>
                                    ⚠️ {(() => {
                                        if (changedParameter === 'color') return 'Color changed!';
                                        if (changedParameter === 'pusherFrames') return 'Pusher Slowness changed!';
                                        if (changedParameter === 'cleanerFrames') return 'Cleaner Slowness changed!';
                                        if (changedParameter === 'rectangleCount') return 'Rectangle Count changed!';
                                        if (changedParameter === 'walker') return 'Walker Gene changed!';
                                        if (changedParameter.startsWith('builder-')) {
                                            const builderIndex = parseInt(changedParameter.split('-')[1]);
                                            return `Builder ${builderIndex + 1} changed!`;
                                        }
                                        if (changedParameter.startsWith('coord-')) {
                                            const parts = changedParameter.split('-');
                                            const coordIndex = parseInt(parts[1]);
                                            const axis = parts[2].toUpperCase();
                                            return `Turmite ${coordIndex + 1} ${axis} position changed!`;
                                        }
                                        return 'Parameter changed!';
                                    })()} All other parameters are now locked.
                                </p>
                                <button
                                    onClick={resetChanges}
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        backgroundColor: '#ffaa00',
                                        color: '#000',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    RESET TO CHANGE A DIFFERENT PARAMETER
                                </button>
                            </div>
                        )}
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
                            color={color}
                        />
                        {!hasChanges && (
                            <div className="canvas-controls">
                                <button onClick={generateRandomCoordinates} className="random-btn">
                                    RANDOMIZE COORDINATES
                                </button>
                            </div>
                        )}
                    </fieldset>

                    <fieldset className="terminal-fieldset">
                        <legend>TURMITE GENES</legend>

                        {/* Color Selection Dropdown */}
                        <div className="gene-section" style={{
                            opacity: isParameterDisabled('color') ? 0.3 : 1,
                            pointerEvents: isParameterDisabled('color') ? 'none' : 'auto',
                            transition: 'opacity 0.3s ease'
                        }}>
                            <p>Select Color Theme</p>
                            <div className="color-dropdown">
                                <select
                                    value={color}
                                    onChange={handleColorChange}
                                    className="color-select"
                                    disabled={isParameterDisabled('color')}
                                >
                                    {COLOR_NAMES.map((name, index) => (
                                        <option key={index} value={index}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Animation Parameters - Each parameter individually controlled */}
                        <div className="gene-section" style={{
                            opacity: isParameterDisabled('pusherFrames') ? 0.3 : 1,
                            pointerEvents: isParameterDisabled('pusherFrames') ? 'none' : 'auto',
                            transition: 'opacity 0.3s ease'
                        }}>
                            <p>Pusher Slowness (frames to wait)</p>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={pusherFrames}
                                onChange={(e) => handlePusherChange(parseInt(e.target.value) || 1)}
                                disabled={isParameterDisabled('pusherFrames')}
                                className="animation-input"
                            />
                        </div>

                        <div className="gene-section" style={{
                            opacity: isParameterDisabled('cleanerFrames') ? 0.3 : 1,
                            pointerEvents: isParameterDisabled('cleanerFrames') ? 'none' : 'auto',
                            transition: 'opacity 0.3s ease'
                        }}>
                            <p>Cleaner Slowness (frames to wait)</p>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={cleanerFrames}
                                onChange={(e) => handleCleanerChange(parseInt(e.target.value) || 1)}
                                disabled={isParameterDisabled('cleanerFrames')}
                                className="animation-input"
                            />
                        </div>

                        <div className="gene-section" style={{
                            opacity: isParameterDisabled('rectangleCount') ? 0.3 : 1,
                            pointerEvents: isParameterDisabled('rectangleCount') ? 'none' : 'auto',
                            transition: 'opacity 0.3s ease'
                        }}>
                            <p>Rectangle Count</p>
                            <input
                                type="number"
                                min="1"
                                max="30"
                                value={rectangleCount}
                                onChange={(e) => handleRectangleChange(parseInt(e.target.value) || 1)}
                                disabled={isParameterDisabled('rectangleCount')}
                                className="animation-input"
                            />
                        </div>

                        <div className="gene-section">
                            <fieldset className="terminal-fieldset">
                                <legend>BUILDER TURMITES (3 TYPES)</legend>
                                {builderGenes.map((gene, index) => (
                                    <div
                                        key={`builder-${index}`}
                                        className="gene-selector"
                                        style={{
                                            opacity: isParameterDisabled(`builder-${index}`) ? 0.3 : 1,
                                            pointerEvents: isParameterDisabled(`builder-${index}`) ? 'none' : 'auto',
                                            transition: 'opacity 0.3s ease'
                                        }}
                                    >
                                        <p>Builder {index + 1}</p>
                                        <div className="gene-options">
                                            {BUILDER_GENES.map((option, optionIndex) => (
                                                <label key={`builder-${index}-option-${optionIndex}`} className="gene-option">
                                                    <input
                                                        type="radio"
                                                        name={`builder-${index}`}
                                                        checked={gene === option}
                                                        onChange={() => handleBuilderGeneChange(index, option)}
                                                        disabled={isParameterDisabled(`builder-${index}`)}
                                                    />
                                                    <span className="gene-name">Type {optionIndex + 1}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </fieldset>
                        </div>

                        <div className="gene-section" style={{
                            opacity: isParameterDisabled('walker') ? 0.3 : 1,
                            pointerEvents: isParameterDisabled('walker') ? 'none' : 'auto',
                            transition: 'opacity 0.3s ease'
                        }}>
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
                                                    disabled={isParameterDisabled('walker')}
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
                                            onFocus={(e) => e.target.select()}
                                            placeholder="X"
                                            disabled={isParameterDisabled(`coord-${index}-x`)}
                                            style={{
                                                opacity: isParameterDisabled(`coord-${index}-x`) ? 0.3 : 1,
                                                transition: 'opacity 0.3s ease'
                                            }}
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="256"
                                            value={coord.y}
                                            onChange={(e) => handleCoordinateChange(index, 'y', e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="Y"
                                            disabled={isParameterDisabled(`coord-${index}-y`)}
                                            style={{
                                                opacity: isParameterDisabled(`coord-${index}-y`) ? 0.3 : 1,
                                                transition: 'opacity 0.3s ease'
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="terminal-fieldset">
                        <legend>ZK PROOF GENERATION</legend>
                        <div className="encryption-section">
                            <h3>Re-Encrypt & Update Token</h3>
                            <RequireWallets>
                                <ProofGenerator
                                    onGenerateProof={async () => {
                                        if (!publicKey || !privateKey || !secretScalar) {
                                            throw new Error("Wallet not registered. Please register your public key first.");
                                        }

                                        if (!decryptedToken || !decryptedToken.lastOwnerPubKeys || !decryptedToken.usedEncryptionKey || !decryptedToken.decryptedData) {
                                            throw new Error("Token data incomplete - cannot generate re-cipher proof");
                                        }

                                        // Get the ORIGINAL decrypted data from the blockchain
                                        const originalMessage = decryptedToken.decryptedData.rawDecryption;

                                        // Encode the NEW data (with modified parameter)
                                        const allRules = builderGenes.concat(walkerGene);
                                        // Color is 0-15 in UI but encoding expects 1-16
                                        const newMessage = toBigInts(encodeAll(coordinates, allRules, chaosNumbers, color + 1));

                                        // CRITICAL TEST: Re-encode the ORIGINAL values to see if encoding is lossy
                                        if (originalValues) {
                                            const originalRules = originalValues.builderGenes.concat(originalValues.walkerGene);
                                            const originalChaos = [originalValues.pusherFrames, originalValues.cleanerFrames, originalValues.rectangleCount];
                                            const reEncodedOriginal = toBigInts(encodeAll(originalValues.coordinates, originalRules, originalChaos, originalValues.color + 1));

                                            console.log('=== ENCODING FIDELITY TEST ===');
                                            console.log('Original from blockchain:', originalMessage);
                                            console.log('Re-encoded original state:', reEncodedOriginal);
                                            console.log('Re-encoding is perfect:', originalMessage.every((v, i) => v === reEncodedOriginal[i]));
                                        }

                                        console.log('=== DETAILED COMPARISON ===');
                                        console.log('Slot differences:', [
                                            originalMessage[0] !== newMessage[0] ? 'SLOT1' : '-',
                                            originalMessage[1] !== newMessage[1] ? 'SLOT2' : '-',
                                            originalMessage[2] !== newMessage[2] ? 'SLOT3' : '-'
                                        ].filter(x => x !== '-'));
                                        console.log('Which parameter changed:', changedParameter);

                                        const newEncryptionKey = generateEncryptionKey();
                                        const currentTimestamp = timeStamp();
                                        const newCipherText = poseidonEncryption(currentTimestamp, newEncryptionKey, newMessage);

                                        // Get the last owner's public keys (the person who sent you this NFT)
                                        const lastOwnerPublicKey: [bigint, bigint] = [
                                            decryptedToken.lastOwnerPubKeys[0],
                                            decryptedToken.lastOwnerPubKeys[1]
                                        ];

                                        // Compute the old ECDH encryption key from the last owner's public key and your private key
                                        // This is the key that was used to encrypt when you received the NFT
                                        const oldEncryptionKey = genEcdhSharedKey(lastOwnerPublicKey);

                                        if (!oldEncryptionKey) {
                                            throw new Error("Failed to compute old ECDH encryption key");
                                        }

                                        // The old ciphertext is from the blockchain
                                        const oldCipherText = decryptedToken.encryptedNote.slice(0, 4) as bigint[];
                                        const oldNonce = decryptedToken.encryptedNote[4];

                                        console.log('Generating re-cipher proof:');
                                        console.log('- Last owner (old sender):', lastOwnerPublicKey);
                                        console.log('- Current owner (me, new receiver):', publicKey);
                                        console.log('- Old encryption key:', oldEncryptionKey);
                                        console.log('- New encryption key:', newEncryptionKey);
                                        console.log('- Old ciphertext from blockchain:', oldCipherText);
                                        console.log('- Old nonce from blockchain:', oldNonce);
                                        console.log('- Original message (old):', originalMessage);
                                        console.log('- New message (modified):', newMessage);

                                        // Verify we can re-compute the old ciphertext for debugging
                                        const recomputedOldCiphertext = poseidonEncryption(oldNonce, oldEncryptionKey, originalMessage);
                                        console.log('- Re-computed old ciphertext:', recomputedOldCiphertext);

                                        // Check if they match
                                        const ciphertextMatches = recomputedOldCiphertext.every((val, idx) => val === oldCipherText[idx]);
                                        console.log('- Old ciphertext matches blockchain:', ciphertextMatches);

                                        if (!ciphertextMatches) {
                                            console.error('ERROR: Re-computed ciphertext does not match blockchain ciphertext!');
                                            console.error('This means the oldEncryptionKey or originalMessage is incorrect');
                                        }

                                        // Check how many values differ
                                        // let differencesCount = 0;
                                        // for (let i = 0; i < 3; i++) {
                                        //     if (originalMessage[i] !== newMessage[i]) {
                                        //         differencesCount++;
                                        //         console.log(`  Difference at index ${i}: ${originalMessage[i]} -> ${newMessage[i]}`);
                                        //     }
                                        // }
                                        // console.log(`Total differences: ${differencesCount}`);

                                        // if (differencesCount !== 1) {
                                        //     throw new Error(`Expected exactly 1 difference between old and new message, but found ${differencesCount}. This means either no parameters changed, or the encoding doesn't preserve all other values.`);
                                        // }

                                        // For re-cipher: Prove you can decrypt old data and encrypt new data with ONE parameter changed
                                        const proof = await generateProofTurmite(
                                            secretScalar,                // myPrivateKey (derived secret scalar)
                                            lastOwnerPublicKey,          // oldSenderPublicKey (previous owner's public key)
                                            publicKey,                   // newReciverPublicKey (your own public key - encrypting to self)
                                            oldEncryptionKey,            // oldResultKey (ECDH key used to encrypt when you received it)
                                            newEncryptionKey,            // newResultKey (new ECDH key with your own keypair)
                                            originalMessage,             // oldMessage (3 slots - ORIGINAL data from blockchain)
                                            newMessage,                  // newMessage (3 slots - MODIFIED data with one parameter changed)
                                            oldCipherText,               // oldComputedCipherText (4 elements from blockchain)
                                            newCipherText,               // newComputedCipherText (4 elements newly encrypted)
                                            oldNonce,                    // oldNonce (from blockchain)
                                            currentTimestamp,            // newNonce (new timestamp)
                                            publicKey,                   // myPublicKey (your public key)
                                            "1"                          // enableOneValueCheck (enabled for re-cipher)
                                        );


                                        return proof.calldata;
                                    }}
                                    autoGenerate={false}
                                    triggerDeps={[coordinates, builderGenes, walkerGene, chaosNumbers, color, pusherFrames, cleanerFrames, rectangleCount]}
                                    preparingMessage="Preparing re-cipher proof generation..."
                                    generatingMessage="Generating zero-knowledge proof for re-encryption..."
                                    readyMessage="Proof generated successfully! Ready to re-cipher."
                                >
                                    {({ proofCalldata, status, generateManually }) => (
                                        <>
                                            {status === 'idle' && (
                                                <button onClick={generateManually}>Generate Proof</button>
                                            )}
                                            {proofCalldata && tokenId && (
                                                <ReCipherNFT calldata={proofCalldata} tokenId={tokenId} />
                                            )}
                                        </>
                                    )}
                                </ProofGenerator>
                            </RequireWallets>
                        </div>
                    </fieldset>
                </div>
            </div>
        </div>
    );
};

export default EditTokenPage;
