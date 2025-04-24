import React, { useState, useEffect } from 'react';
import CipherWrapperIframe from './canvasWrapper';
import encodeAll from './encodingUtils.js';
import { useWallet } from './cipherWallet';

import { decodeSlot1, decodeSlot2, decodeSlot3, timeStamp, toBigInts } from './encodingUtils.js';
import { poseidonDecrypt } from '@zk-kit/poseidon-cipher';
import { generateProofTurmite } from './ProofSystem.tsx'

// Define turmite gene constants
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
    "Red",
    "Blue",
    "Purple",
    "Lime",
    "Brown",
    "Gray1",
    "Gray2",
    "White",
    "Red Blood",
    "Orange",
    "Yellow",
    "Green",
    "Lavender",
    "Pink",
    "Peach"
];

const MintPage = () => {

    const {
        publicKey,
        privateKey,
        isGenerated,
        isBackedUp,
        generateEncryptionKey,
        poseidonEncryption
    } = useWallet();

    // Generate random coordinates between 0 and 256
    const generateRandomCoords = () => Array(20).fill().map(() => ({
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
    const [color, setColor] = useState(0);
    const [chaosNumbers, setChaosNumbers] = useState([0, 0, 0]);


    // Handle coordinate input changes
    const handleCoordinateChange = (index, axis, value) => {
        const newCoordinates = [...coordinates];
        // Ensure value is a number and within canvas bounds (0-256)
        const numValue = parseInt(value) || 0;
        const boundedValue = Math.min(Math.max(numValue, 0), 256);

        newCoordinates[index] = {
            ...newCoordinates[index],
            [axis]: boundedValue
        };

        setCoordinates(newCoordinates);
    };

    // Handle color selection change
    const handleColorChange = (e) => {
        const selectedColor = parseInt(e.target.value);
        setChaosNumbers([0, selectedColor, 0]);
        setColor(selectedColor);
    };

    const handleGenerateProof = () => {
        if (publicKey && privateKey) {
            var allRules = builderGenes.concat(walkerGene)
            const encoded = toBigInts(encodeAll(coordinates, allRules, [4, 5, 10]));
            console.log(encoded)
            const newEncryptionKey = generateEncryptionKey();
            const currentTimestamp = timeStamp()
            const cipherText = poseidonEncryption(currentTimestamp, newEncryptionKey, encoded);

            // Include color in the proof generation
            //const proof = generateProofTurmite(privateKey, publicKey, encoded, color);
            //console.log(cipherText)

            // const testDecryption = poseidonDecrypt(cipherText, newEncryptionKey, currentTimestamp, 3)
            // console.log(testDecryption)
            /// test with decryption plz
        } else {
            console.log("not registerd")
        }
    }

    // Generate random coordinates
    const generateRandomCoordinates = () => {
        setCoordinates(generateRandomCoords());
    };

    // Load data from localStorage
    useEffect(() => {
    }, []);

    // Handle builder gene selection
    const handleBuilderGeneChange = (index, gene) => {
        const newBuilderGenes = [...builderGenes];
        newBuilderGenes[index] = gene;
        setBuilderGenes(newBuilderGenes);
    };

    // Handle walker gene selection
    const handleWalkerGeneChange = (gene) => {
        setWalkerGene(gene);
    };

    return (
        <div className="mint-page">
            <div className="mint-content">
                <h2>MINT YOUR TURMITE</h2>
                <p>Set the starting coordinates and select genetic patterns for your turmites</p>

                <div className="mint-grid">
                    <div className="canvas-section">
                        <CipherWrapperIframe
                            coordinates={coordinates}
                            builderTurmites={builderGenes}
                            walkerTurmites={[walkerGene]}
                            speed={1}
                            chaosNumbers={chaosNumbers}
                        />
                        <div className="canvas-controls">
                            <button onClick={generateRandomCoordinates} className="random-btn">
                                RANDOMIZE COORDINATES
                            </button>
                        </div>
                    </div>

                    <div className="gene-selection">
                        <h3>TURMITE GENES</h3>

                        {/* Color Selection Dropdown */}
                        <div className="gene-section">
                            <h4>COLOR PALETTE</h4>
                            <div className="color-selector">
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
                        </div>

                        <div className="gene-section">
                            <h4>BUILDER TURMITES (3 types)</h4>
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
                        </div>

                        <div className="gene-section">
                            <h4>WALKER TURMITE</h4>
                            <div className="gene-selector">
                                <p>Select Walker Gene</p>
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
                        </div>
                    </div>

                    <div className="coordinates-section">
                        <h3>TURMITE COORDINATES</h3>
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
                    </div>

                    <div className="encryption-section">
                        <h3>Encrypt & Mint</h3>
                        <button onClick={handleGenerateProof}>Encrypt meee</button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MintPage;



// import React, { useState, useEffect } from 'react';
// import CipherWrapperIframe from './canvasWrapper';
// import encodeAll from './encodingUtils.js';
// import { useWallet } from './cipherWallet';

// import { decodeSlot1, decodeSlot2, decodeSlot3, timeStamp, toBigInts } from './encodingUtils.js';
// import { poseidonDecrypt } from '@zk-kit/poseidon-cipher';
// import { generateProofTurmite } from './ProofSystem.tsx'

// // Define turmite gene constants
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

// const MintPage = () => {

//     const {
//         publicKey,
//         privateKey,
//         isGenerated,
//         isBackedUp,
//         generateEncryptionKey,
//         poseidonEncryption
//     } = useWallet();

//     // Generate random coordinates between 0 and 256
//     const generateRandomCoords = () => Array(20).fill().map(() => ({
//         x: Math.floor(Math.random() * 256),
//         y: Math.floor(Math.random() * 256)
//     }));

//     // State for coordinates
//     const [coordinates, setCoordinates] = useState(generateRandomCoords());

//     // State for selected genes
//     const [builderGenes, setBuilderGenes] = useState([
//         BUILDER_GENES[0],
//         BUILDER_GENES[1],
//         BUILDER_GENES[2]
//     ]);
//     const [walkerGene, setWalkerGene] = useState(WALKER_GENES[0]);

//     // Handle coordinate input changes
//     const handleCoordinateChange = (index, axis, value) => {
//         const newCoordinates = [...coordinates];
//         // Ensure value is a number and within canvas bounds (0-256)
//         const numValue = parseInt(value) || 0;
//         const boundedValue = Math.min(Math.max(numValue, 0), 256);

//         newCoordinates[index] = {
//             ...newCoordinates[index],
//             [axis]: boundedValue
//         };

//         setCoordinates(newCoordinates);

//     };

//     const handleGenerateProof = () => {


//         if (publicKey && privateKey) {
//             var allRules = builderGenes.concat(walkerGene)
//             const encoded = toBigInts(encodeAll(coordinates, allRules, [4, 5, 10]));
//             console.log(encoded)
//             const newEncryptionKey = generateEncryptionKey();
//             const currentTimestamp = timeStamp()
//             const cipherText = poseidonEncryption(currentTimestamp, newEncryptionKey, encoded);

//             const proof = generateProofTurmite(privateKey,publicKey,encoded,)
//             //console.log(cipherText)

//             // const testDecryption = poseidonDecrypt(cipherText, newEncryptionKey, currentTimestamp, 3)
//             // console.log(testDecryption)
//             /// test with decryption plz
//         } else {
//             console.log("not registerd")
//         }

//     }


//     // Generate random coordinates
//     const generateRandomCoordinates = () => {
//         setCoordinates(generateRandomCoords());
//     };

//     // Load data from localStorage
//     useEffect(() => {
//     }, []);

//     // Handle builder gene selection
//     const handleBuilderGeneChange = (index, gene) => {
//         const newBuilderGenes = [...builderGenes];
//         newBuilderGenes[index] = gene;
//         setBuilderGenes(newBuilderGenes);
//     };

//     // Handle walker gene selection
//     const handleWalkerGeneChange = (gene) => {
//         setWalkerGene(gene);
//     };

//     return (
//         <div className="mint-page">
//             <div className="mint-content">
//                 <h2>MINT YOUR TURMITE</h2>
//                 <p>Set the starting coordinates and select genetic patterns for your turmites</p>

//                 <div className="mint-grid">
//                     <div className="canvas-section">
//                         <CipherWrapperIframe
//                             coordinates={coordinates}
//                             builderTurmites={builderGenes}
//                             walkerTurmites={[walkerGene]}
//                             speed={1}
//                             chaosNumbers={[2, 5, 6]}
//                         />
//                         <div className="canvas-controls">
//                             <button onClick={generateRandomCoordinates} className="random-btn">
//                                 RANDOMIZE COORDINATES
//                             </button>
//                         </div>
//                     </div>

//                     <div className="gene-selection">
//                         <h3>TURMITE GENES</h3>

//                         <div className="gene-section">
//                             <h4>BUILDER TURMITES (3 types)</h4>
//                             {builderGenes.map((gene, index) => (
//                                 <div key={`builder-${index}`} className="gene-selector">
//                                     <p>Builder {index + 1}</p>
//                                     <div className="gene-options">
//                                         {BUILDER_GENES.map((option, optionIndex) => (
//                                             <label key={`builder-${index}-option-${optionIndex}`} className="gene-option">
//                                                 <input
//                                                     type="radio"
//                                                     name={`builder-${index}`}
//                                                     checked={gene === option}
//                                                     onChange={() => handleBuilderGeneChange(index, option)}
//                                                 />
//                                                 <span className="gene-name">Type {optionIndex + 1}</span>
//                                             </label>
//                                         ))}
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>

//                         <div className="gene-section">
//                             <h4>WALKER TURMITE</h4>
//                             <div className="gene-selector">
//                                 <p>Select Walker Gene</p>
//                                 <div className="gene-options">
//                                     {WALKER_GENES.map((option, optionIndex) => (
//                                         <label key={`walker-option-${optionIndex}`} className="gene-option">
//                                             <input
//                                                 type="radio"
//                                                 name="walker-gene"
//                                                 checked={walkerGene === option}
//                                                 onChange={() => handleWalkerGeneChange(option)}
//                                             />
//                                             <span className="gene-name">Type {optionIndex + 1}</span>
//                                         </label>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="coordinates-section">
//                         <h3>TURMITE COORDINATES</h3>
//                         <div className="coordinates-list">
//                             {coordinates.slice(0, 20).map((coord, index) => (
//                                 <div key={index} className="coordinate-item">
//                                     <span className="coordinate-label">Turmite {index + 1}:</span>
//                                     <div className="coordinate-inputs">
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             max="256"
//                                             value={coord.x}
//                                             onChange={(e) => handleCoordinateChange(index, 'x', e.target.value)}
//                                             placeholder="X"
//                                         />
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             max="256"
//                                             value={coord.y}
//                                             onChange={(e) => handleCoordinateChange(index, 'y', e.target.value)}
//                                             placeholder="Y"
//                                         />
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>

//                     <div className="encryption-section">
//                         <h3>Encrypt & Mint</h3>
//                         <button onClick={handleGenerateProof}>Encrypt meee</button>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default MintPage;
