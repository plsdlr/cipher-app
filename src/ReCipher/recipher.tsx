import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CipherWrapperIframe from '../canvasWrapper.tsx';
import { useDecryptToken } from '../ViewAndSendPage/useDecryptToken.ts';
import { useConsole } from '../console/ConsoleContext.tsx';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import { generateProofTurmite } from '../ProofSystem/ProofSystem.tsx'
import encodeAll from '../utils/encodingUtils.js';
import { timeStamp, toBigInts } from '../utils/encodingUtils.js';
import { ReCipherNFT } from './ReCipherConnector.tsx';
import { ProofGenerator, RequireWallets } from '../components';
import AnimationParameterSelector from '../components/AnimationParameterSelector.tsx';

///to do: implement market in solidity + implement cipher function in solidity contract

type GeneType = {
    rule: string;
    name: string;
};

const BUILDER_GENES: GeneType[] = [
    { rule: "ff0201ff0201ff0000ff0001", name: "Trails" },
    { rule: "ff0801000200000800ff0800", name: "Ornament" },
    { rule: "ff0201000201ff0400000000", name: "Cave" },
    { rule: "ff0201000801ff0000000000", name: "Cross" },
    { rule: "ff0201ff0000ff0000000800", name: "Crystal" },
    { rule: "ff0201000800ff0000000801", name: "Motion" },
    { rule: "ff0001000001ff0801000000", name: "Twisted" },
    { rule: "ff0001000201ff0000000800", name: "Swift" },
    { rule: "ff0201ff0800000000000801", name: "Lamp" },
    { rule: "ff0200000801ff0800000201", name: "Guwoz" },
    { rule: "ff0800ff0201000200000801", name: "Crown" },
    { rule: "ff0201ff0000000200ff0400", name: "Snow" },
    { rule: "ff0201ff0201ff0400000000", name: "Vermin" },
    { rule: "ff0400000401ff0200ff0801", name: "Ibis" }
];

const WALKER_GENES: GeneType[] = [
    { rule: "ff0000ff0801000000000200", name: "Paragon" },
    { rule: "ff0801ff0200000200ff0001", name: "Aurora (r)" },
    { rule: "ff0001ff0800000000ff0001", name: "Peregrine (r)" },
    { rule: "ff0000ff0801ff0400000200", name: "Flock" },
    { rule: "ff0001000801ff0000ff0200", name: "Ant" },
    { rule: "ff0001ff0201ff0000ff0800", name: "Epitome" },
    { rule: "ff0400000401ff0200ff0801", name: "Ibis" },
    { rule: "ff0200000001000000ff0801", name: "terra" }
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
    const navigate = useNavigate();

    const handleReCipherSuccess = useCallback(() => {
        addMessage("Token re-ciphered successfully! Redirecting to View page...", "success");
        setTimeout(() => {
            navigate('/view');
        }, 2000);
    }, [addMessage, navigate]);

    // Get decrypted token data
    const { data: decryptedToken, isLoading: isDecrypting, error: decryptError } = useDecryptToken(tokenId ?? null);

    // State for editable values
    const [coordinates, setCoordinates] = useState<{ x: number, y: number }[]>([]);
    const [builderGenes, setBuilderGenes] = useState<GeneType[]>([
        BUILDER_GENES[0], BUILDER_GENES[1], BUILDER_GENES[2]
    ]);
    const [walkerGene, setWalkerGene] = useState<GeneType>(WALKER_GENES[0]);
    const [color, setColor] = useState<number>(0);
    const [pusherFrames, setPusherFrames] = useState<number>(11);
    const [cleanerFrames, setCleanerFrames] = useState<number>(1);
    const [rectangleCount, setRectangleCount] = useState<number>(5);
    const [chaosNumbers, setChaosNumbers] = useState<number[]>([11, 1, 5]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // State to track original values
    const [originalValues, setOriginalValues] = useState<{
        coordinates: { x: number, y: number }[];
        builderGenes: GeneType[];
        walkerGene: GeneType;
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
            const loadedCoordinates = decryptedToken.decryptedData.positions || [];
            setCoordinates(loadedCoordinates);

            const rules: string[] = decryptedToken.decryptedData.rules || [];
            const loadedBuilderGenes = rules.slice(0, 3).map(rule =>
                BUILDER_GENES.find(g => g.rule === rule) || { rule, name: 'Unknown' }
            );
            const loadedWalkerGene =
                WALKER_GENES.find(g => g.rule === rules[3]) ||
                { rule: rules[3] || WALKER_GENES[0].rule, name: 'Unknown' };
            setBuilderGenes(loadedBuilderGenes);
            setWalkerGene(loadedWalkerGene);

            const additionalValues = decryptedToken.decryptedData.additionalValues || { value1: 11, value2: 1, value3: 5 };
            const decodedColor = decryptedToken.decryptedData.color || 1;

            const loadedPusherFrames = additionalValues.value1 === 0 ? 11 : additionalValues.value1;
            const loadedCleanerFrames = additionalValues.value2 === 0 ? 1 : additionalValues.value2;
            const loadedRectangleCount = additionalValues.value3 || 5;
            const loadedColor = decodedColor - 1; // Convert from 1-16 to 0-15 for UI

            setPusherFrames(loadedPusherFrames);
            setCleanerFrames(loadedCleanerFrames);
            setRectangleCount(loadedRectangleCount);
            setChaosNumbers([additionalValues.value1, additionalValues.value2, additionalValues.value3]);
            setColor(loadedColor);

            setOriginalValues({
                coordinates: JSON.parse(JSON.stringify(loadedCoordinates)),
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

        if (color !== originalValues.color) {
            setHasChanges(true);
            setChangedParameter('color');
            return;
        }

        // Animation params are treated as one group
        if (pusherFrames !== originalValues.pusherFrames ||
            cleanerFrames !== originalValues.cleanerFrames ||
            rectangleCount !== originalValues.rectangleCount) {
            setHasChanges(true);
            setChangedParameter('animation');
            return;
        }

        for (let i = 0; i < builderGenes.length; i++) {
            if (builderGenes[i].rule !== originalValues.builderGenes[i].rule) {
                setHasChanges(true);
                setChangedParameter(`builder-${i}`);
                return;
            }
        }

        if (walkerGene.rule !== originalValues.walkerGene.rule) {
            setHasChanges(true);
            setChangedParameter('walker');
            return;
        }

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
        let boundedValue: number;
        if (value === '' || value === '-') {
            boundedValue = 0;
        } else {
            const numValue = parseInt(value);
            boundedValue = Math.min(Math.max(numValue, 0), 256);
        }
        addMessage(`Coordinate change: Turmite ${index + 1} ${axis.toUpperCase()} = ${boundedValue}`, "info");
        newCoordinates[index] = { ...newCoordinates[index], [axis]: boundedValue };
        setCoordinates(newCoordinates);
    };

    // Handle builder gene selection
    const handleBuilderGeneChange = (index: number, gene: GeneType) => {
        const newBuilderGenes = [...builderGenes];
        newBuilderGenes[index] = gene;
        setBuilderGenes(newBuilderGenes);
        addMessage(`Builder gene ${index + 1} changed to: ${gene.name}`, "info");
    };

    // Handle walker gene selection
    const handleWalkerGeneChange = (gene: GeneType) => {
        setWalkerGene(gene);
        addMessage(`Walker gene changed to: ${gene.name}`, "info");
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

    if (isDecrypting) {
        return <div>Loading and decrypting token #{tokenId}...</div>;
    }

    if (decryptError) {
        return <div style={{ color: 'red' }}>Error decrypting token: {decryptError}</div>;
    }

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
                        <p>You can only change ONE parameter per re-cipher operation</p>
                        {hasChanges && changedParameter && (
                            <fieldset className="terminal-fieldset" style={{
                                marginTop: '15px',
                                borderColor: 'var(--color-orange)',
                            }}>
                                <legend style={{ color: 'var(--color-orange)' }}>LOCKED</legend>
                                <p style={{ color: 'var(--color-orange)', marginBottom: '12px' }}>
                                    {(() => {
                                        if (changedParameter === 'color') return 'Color changed — all other parameters are locked.';
                                        if (changedParameter === 'animation') return 'Animation parameters changed — all other parameters are locked.';
                                        if (changedParameter === 'walker') return 'Walker Gene changed — all other parameters are locked.';
                                        if (changedParameter.startsWith('builder-')) {
                                            const builderIndex = parseInt(changedParameter.split('-')[1]);
                                            return `Builder ${builderIndex + 1} changed — all other parameters are locked.`;
                                        }
                                        if (changedParameter.startsWith('coord-')) {
                                            const parts = changedParameter.split('-');
                                            const coordIndex = parseInt(parts[1]);
                                            const axis = parts[2].toUpperCase();
                                            return `Turmite ${coordIndex + 1} ${axis} position changed — all other parameters are locked.`;
                                        }
                                        return 'Parameter changed — all other parameters are locked.';
                                    })()}
                                </p>
                                <button onClick={resetChanges} className="random-btn">
                                    RESET TO CHANGE A DIFFERENT PARAMETER
                                </button>
                            </fieldset>
                        )}
                    </div>
                </fieldset>

                <div className="mint-grid">
                    <fieldset className="terminal-fieldset">
                        <legend>PREVIEW</legend>
                        <CipherWrapperIframe
                            coordinates={coordinates}
                            builderTurmites={builderGenes.map(g => g.rule)}
                            walkerTurmites={[walkerGene.rule]}
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

                        {/* Color Selection */}
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

                        {/* Animation Parameters */}
                        <div style={{
                            opacity: isParameterDisabled('animation') ? 0.3 : 1,
                            pointerEvents: isParameterDisabled('animation') ? 'none' : 'auto',
                            transition: 'opacity 0.3s ease'
                        }}>
                            <AnimationParameterSelector
                                pusherFrames={pusherFrames}
                                cleanerFrames={cleanerFrames}
                                rectangleCount={rectangleCount}
                                onPusherChange={handlePusherChange}
                                onCleanerChange={handleCleanerChange}
                                onRectangleChange={handleRectangleChange}
                                includeRectangleCount={true}
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
                                                        checked={gene.rule === option.rule}
                                                        onChange={() => handleBuilderGeneChange(index, option)}
                                                        disabled={isParameterDisabled(`builder-${index}`)}
                                                    />
                                                    <span className="gene-name">{option.name}</span>
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
                                                    checked={walkerGene.rule === option.rule}
                                                    onChange={() => handleWalkerGeneChange(option)}
                                                    disabled={isParameterDisabled('walker')}
                                                />
                                                <span className="gene-name">{option.name}</span>
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

                                        const originalMessage = decryptedToken.decryptedData.rawDecryption;

                                        const allRules = builderGenes.map(g => g.rule).concat(walkerGene.rule);
                                        // Color is 0-15 in UI but encoding expects 1-16
                                        const newMessage = toBigInts(encodeAll(coordinates, allRules, chaosNumbers, color + 1));

                                        // CRITICAL TEST: Re-encode the ORIGINAL values to see if encoding is lossy
                                        if (originalValues) {
                                            const originalRules = originalValues.builderGenes.map(g => g.rule).concat(originalValues.walkerGene.rule);
                                            const originalChaos = [originalValues.pusherFrames, originalValues.cleanerFrames, originalValues.rectangleCount];
                                            const reEncodedOriginal = toBigInts(encodeAll(originalValues.coordinates, originalRules, originalChaos, originalValues.color + 1));

                                            console.log('=== ENCODING FIDELITY TEST ===');
                                            console.log('Original from blockchain:', originalMessage);
                                            console.log('Re-encoded original state:', reEncodedOriginal);
                                            console.log('Re-encoding is perfect:', originalMessage.every((v: bigint, i: number) => v === reEncodedOriginal[i]));
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

                                        const lastOwnerPublicKey: [bigint, bigint] = [
                                            decryptedToken.lastOwnerPubKeys[0],
                                            decryptedToken.lastOwnerPubKeys[1]
                                        ];

                                        const oldEncryptionKey = genEcdhSharedKey(lastOwnerPublicKey);

                                        if (!oldEncryptionKey) {
                                            throw new Error("Failed to compute old ECDH encryption key");
                                        }

                                        const oldCipherText = decryptedToken.encryptedNote.slice(0, 4) as bigint[];
                                        const oldNonce = decryptedToken.encryptedNote[4];

                                        const recomputedOldCiphertext = poseidonEncryption(oldNonce, oldEncryptionKey, originalMessage);
                                        const ciphertextMatches = recomputedOldCiphertext.every((val, idx) => val === oldCipherText[idx]);
                                        console.log('Old ciphertext matches blockchain:', ciphertextMatches);

                                        if (!ciphertextMatches) {
                                            console.error('ERROR: Re-computed ciphertext does not match blockchain ciphertext!');
                                        }

                                        const proof = await generateProofTurmite(
                                            secretScalar,
                                            lastOwnerPublicKey,
                                            publicKey,
                                            oldEncryptionKey,
                                            newEncryptionKey,
                                            originalMessage,
                                            newMessage,
                                            oldCipherText,
                                            newCipherText,
                                            oldNonce,
                                            currentTimestamp,
                                            publicKey,
                                            "1"
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
                                                <ReCipherNFT calldata={proofCalldata} tokenId={tokenId} onSuccess={handleReCipherSuccess} />
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
