import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CipherWrapperIframe, { CipherWrapperHandle } from '../canvasWrapper.tsx';
import encodeAll from '../utils/encodingUtils.js';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import AnimationParameterSelector from '../components/AnimationParameterSelector.tsx';

import { timeStamp, toBigInts } from '../utils/encodingUtils.js';

import { generateProofTurmite } from '../ProofSystem/ProofSystem.tsx'
import { MintNFT } from './MintConnector.tsx';

import { useConsole } from '../console/ConsoleContext.tsx';
import { ProofGenerator, RequireWallets } from '../components';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { OnboardingModal } from '../components/OnboardingModal';

// Type for gene structure
type GeneType = {
    rule: string;
    name: string;
};

// Define turmite gene constants
// const BUILDER_GENES = [
//     "ff0800ff0201ff0800000001",
//     "ff0801000200000800ff0800",
//     "ff0201000201ff0400000000",
//     "ff0201000801ff0000000000",
//     "ff0201000800ff0000000801",
//     "ff0001000001ff0801000000",
//     "ff0001000201ff0000000800"
// ];


// const WALKER_GENES = [
//     "ff0000ff0801000000000200",
//     "ff0000ff0801000201000000",
//     "ff0000ff0801000201000200",
//     "ff0000ff0801ff0400000200",
//     "ff0001000200000200000200",
//     "ff0001000200000200ff0000",
//     "ff0001000801ff0000ff0200",
//     "ff0001ff0201ff0000ff0800"
// ];

const BUILDER_GENES = [
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


const WALKER_GENES = [
    { rule: "ff0000ff0801000000000200", name: "Paragon" },
    { rule: "ff0801ff0200000200ff0001", name: "Aurora (r)" },
    { rule: "ff0001ff0800000000ff0001", name: "Peregrine (r]" },
    { rule: "ff0000ff0801ff0400000200", name: "Flock" },
    { rule: "ff0001000801ff0000ff0200", name: "Ant" }, //// this one needs to stay
    { rule: "ff0001ff0201ff0000ff0800", name: "Epitome" },
    { rule: "ff0400000401ff0200ff0801", name: "Ibis" },
    { rule: "ff0200000001000000ff0801", name: "terra" }
];

// Color palette names for dropdown display
const COLOR_NAMES = [
    "Red",
    "Blue",
    "Purple",
    "Lime",
    "Brown",
    "Peach",
    "Gray2",
    "White",
    "Red Blood",
    "Orange",
    "Yellow",
    "Green",
    "Blue2",
    "Lavender",
    "Pink",
];

const MintPage = () => {

    const navigate = useNavigate();
    const cipherRef = useRef<CipherWrapperHandle>(null);

    const {
        publicKey,
        privateKey,
        generateEncryptionKey,
        poseidonEncryption,
        secretScalar
    } = useWallet();

    const { addMessage } = useConsole();

    // Onboarding modal state
    const { needsOnboarding, dismissOnboarding } = useOnboardingStatus();
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        setShowOnboarding(needsOnboarding);
    }, [needsOnboarding]);

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
    };

    const handleOnboardingDismiss = () => {
        dismissOnboarding();
        setShowOnboarding(false);
    };

    // Handle successful mint
    const handleMintSuccess = useCallback(() => {
        addMessage("NFT minted successfully! Redirecting to View page...", "success");
        setTimeout(() => {
            navigate('/view');
        }, 2000);
    }, [addMessage, navigate]);

    // Generate random coordinates between 0 and 256
    const generateRandomCoords = () => Array(20).fill(0).map(() => ({
        x: Math.floor(Math.random() * 256),
        y: Math.floor(Math.random() * 256)
    }));


    // State for coordinates
    const [coordinates, setCoordinates] = useState(generateRandomCoords());

    // State for selected genes
    const [builderGenes, setBuilderGenes] = useState([
        BUILDER_GENES[0],
        BUILDER_GENES[1],
        BUILDER_GENES[2]
    ]);
    const [walkerGene, setWalkerGene] = useState(WALKER_GENES[0]);

    // New state for color selection (0-15)
    const [color, setColor] = useState(7); // White
    const [pusherFrames, setPusherFrames] = useState(11);
    const [cleanerFrames, setCleanerFrames] = useState(1);
    const [rectangleCount, setRectangleCount] = useState(20);
    const [chaosNumbers, setChaosNumbers] = useState([11, 1, 20]); // [pusherSlowness, cleanerSlowness, rectangleCount]


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

        addMessage("coordinates change: " + String(newCoordinates[index].x) + "-" + String(newCoordinates[index].y), "info")

        newCoordinates[index] = {
            ...newCoordinates[index],
            [axis]: boundedValue
        };

        setCoordinates(newCoordinates);
    };

    // Handle color selection change
    const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedColor = parseInt(e.target.value);
        setColor(selectedColor);
    };

    // Keep chaosNumbers synchronized with individual parameter changes
    useEffect(() => {
        setChaosNumbers([pusherFrames, cleanerFrames, rectangleCount]);
    }, [pusherFrames, cleanerFrames, rectangleCount]);

    // Handle animation parameter changes
    const handlePusherChange = (value: number) => {
        setPusherFrames(value);
    };

    const handleCleanerChange = (value: number) => {
        setCleanerFrames(value);
    };

    const handleRectangleChange = (value: number) => {
        setRectangleCount(value);
    };

    // Generate random coordinates
    const generateRandomCoordinates = () => {
        setCoordinates(generateRandomCoords());
        addMessage("randomize coordinates", "info")
    };

    // Generate random genes (respects valid animation parameter combinations)
    const generateRandomGenes = () => {
        const pushers = [11, 11, 11, 15, 15, 15, 6, 25];
        const VALID_COMBINATIONS: Record<number, Record<number, number[]>> = {
            6:  { 1: [20, 30], 2: [5] },
            11: { 1: [20, 25, 30], 2: [5, 20, 25, 30], 3: [5] },
            15: { 1: [5, 20, 25, 30], 2: [5, 20, 25], 3: [5], 4: [5, 20] },
            25: { 1: [5, 30], 2: [5, 25], 3: [5], 4: [5] }
        };
        const randomPusher = pushers[Math.floor(Math.random() * pushers.length)];
        const validCleaners = Object.keys(VALID_COMBINATIONS[randomPusher]).map(Number);
        const randomCleaner = validCleaners[Math.floor(Math.random() * validCleaners.length)];
        const validRects = VALID_COMBINATIONS[randomPusher][randomCleaner];
        const randomRect = validRects[Math.floor(Math.random() * validRects.length)];

        const randomColor = Math.floor(Math.random() * 16);
        const weightedBuilders = [
            ...BUILDER_GENES,
            BUILDER_GENES.find(g => g.name === 'Snow')!,
            BUILDER_GENES.find(g => g.name === 'Guwoz')!,
            BUILDER_GENES.find(g => g.name === 'Vermin')!,
            BUILDER_GENES.find(g => g.name === 'Trails')!,
        ];
        const randomBuilders = [0, 1, 2].map(() => weightedBuilders[Math.floor(Math.random() * weightedBuilders.length)]);
        const randomWalker = WALKER_GENES[Math.floor(Math.random() * WALKER_GENES.length)];

        setColor(randomColor);
        setPusherFrames(randomPusher);
        setCleanerFrames(randomCleaner);
        setRectangleCount(randomRect);
        setBuilderGenes(randomBuilders);
        setWalkerGene(randomWalker);
        addMessage(`randomize genes: builders=${randomBuilders.map(g => g.name).join(', ')} walker=${randomWalker.name}`, "info");
    };

    // Load data from localStorage
    useEffect(() => {
    }, []);

    // Handle builder gene selection
    const handleBuilderGeneChange = (index: number, gene: GeneType) => {
        const newBuilderGenes = [...builderGenes];
        newBuilderGenes[index] = gene;
        setBuilderGenes(newBuilderGenes);
        addMessage("new builder gene: " + gene.name, "info")
    };

    // Handle walker gene selection
    const handleWalkerGeneChange = (gene: GeneType) => {
        setWalkerGene(gene);
        addMessage("new walker gene: " + gene.name, "info")
    };

    return (
        <div className="mint-page">
            {showOnboarding && (
                <OnboardingModal
                    onComplete={handleOnboardingComplete}
                    onDismiss={handleOnboardingDismiss}
                />
            )}
            <div className="mint-content">

                <fieldset className="terminal-fieldset">
                    <legend>MINT PAGE</legend>
                    <div className="terminal-content">

                        <p>Set the starting coordinates and select genetic patterns for your turmites</p>
                    </div>
                </fieldset>


                <div className="mint-grid">

                    <fieldset className="terminal-fieldset">
                        <legend>MINTING PREVIEW</legend>
                        <CipherWrapperIframe
                            ref={cipherRef}
                            coordinates={coordinates}
                            builderTurmites={builderGenes.map(g => g.rule)}
                            walkerTurmites={[walkerGene.rule]}
                            speed={1}
                            chaosNumbers={chaosNumbers}
                            color={color}
                        />
                        <div className="canvas-controls">
                            <button onClick={generateRandomCoordinates} className="random-btn">
                                RANDOMIZE COORDINATES
                            </button>
                            <button onClick={generateRandomGenes} className="random-btn">
                                RANDOMIZE GENES
                            </button>
                            <button onClick={() => cipherRef.current?.toggleFullscreen()}>
                                FULLSCREEN
                            </button>
                        </div>
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

                        {/* Animation Parameters */}
                        <AnimationParameterSelector
                            pusherFrames={pusherFrames}
                            cleanerFrames={cleanerFrames}
                            rectangleCount={rectangleCount}
                            onPusherChange={handlePusherChange}
                            onCleanerChange={handleCleanerChange}
                            onRectangleChange={handleRectangleChange}
                            includeRectangleCount={true}
                        />

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
                                                    <span className="gene-name">{option.name}</span>
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
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="256"
                                            value={coord.y}
                                            onChange={(e) => handleCoordinateChange(index, 'y', e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            placeholder="Y"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="terminal-fieldset">
                        <legend>ZK PROOF GENERATION</legend>
                        <div className="encryption-section">
                            <h3>Encrypt & Mint</h3>
                            <RequireWallets>
                                <ProofGenerator
                                    onGenerateProof={async () => {
                                        if (!publicKey || !privateKey || !secretScalar) {
                                            throw new Error("Wallet not registered. Please register your public key first.");
                                        }

                                        const allRules = builderGenes.map(g => g.rule).concat(walkerGene.rule);
                                        // Color is 0-15 in UI but encoding expects 1-16
                                        const encoded = toBigInts(encodeAll(coordinates, allRules, chaosNumbers, color + 1));
                                        const newEncryptionKey = generateEncryptionKey();
                                        const currentTimestamp = timeStamp();
                                        const cipherText = poseidonEncryption(currentTimestamp, newEncryptionKey, encoded);

                                        console.log('Generating minting proof with public key:', publicKey[0]);

                                        // For minting: Alice encrypts to herself, so all old/new values are the same
                                        const proof = await generateProofTurmite(
                                            secretScalar,                // myPrivateKey (derived secret scalar)
                                            publicKey,                   // oldSenderPublicKey (Alice's public key)
                                            publicKey,                   // newReciverPublicKey (Alice's public key - same)
                                            newEncryptionKey,            // oldResultKey (ECDH key)
                                            newEncryptionKey,            // newResultKey (same ECDH key)
                                            encoded,                     // oldMessage (3 slots)
                                            encoded,                     // newMessage (same 3 slots)
                                            cipherText,                  // oldComputedCipherText (4 elements)
                                            cipherText,                  // newComputedCipherText (same 4 elements)
                                            currentTimestamp,            // oldNonce
                                            currentTimestamp,            // newNonce (same)
                                            publicKey,                   // myPublicKey
                                            "0"                          // enableOneValueCheck (disabled for minting)
                                        );

                                        return proof.calldata;
                                    }}
                                    autoGenerate={false}
                                    triggerDeps={[coordinates, builderGenes, walkerGene, chaosNumbers, color, pusherFrames, cleanerFrames]}
                                    preparingMessage="Preparing proof generation..."
                                    generatingMessage="Generating zero-knowledge proof (this may take a moment)..."
                                    readyMessage="Proof generated successfully! Ready to mint."
                                >
                                    {({ proofCalldata, status, generateManually }) => (
                                        <>
                                            {status === 'idle' && (
                                                <button onClick={generateManually}>Generate Proof</button>
                                            )}
                                            {proofCalldata && (
                                                <MintNFT
                                                    calldata={proofCalldata}
                                                    onSuccess={handleMintSuccess}
                                                />
                                            )}
                                        </>
                                    )}
                                </ProofGenerator>
                            </RequireWallets>
                        </div>
                    </fieldset>

                    {/* Temporary Export Button */}
                    <fieldset className="terminal-fieldset">
                        <legend>EXPORT VALUES (DEBUG)</legend>
                        <button
                            onClick={() => {
                                const exportData = {
                                    coordinates,
                                    builderGenes: builderGenes.map(g => ({ rule: g.rule, name: g.name })),
                                    walkerGene: { rule: walkerGene.rule, name: walkerGene.name },
                                    color,
                                    pusherFrames,
                                    cleanerFrames,
                                    rectangleCount,
                                    chaosNumbers
                                };
                                const jsonString = JSON.stringify(exportData, null, 2);
                                const blob = new Blob([jsonString], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `mint-values-${Date.now()}.json`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                                addMessage("Exported mint values to JSON", "success");
                            }}
                            className="export-btn"
                        >
                            EXPORT VALUES AS JSON
                        </button>
                    </fieldset>
                </div>

            </div>
        </div >
    );
};

export default MintPage;


