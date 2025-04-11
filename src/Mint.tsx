import React, { useState, useEffect } from 'react';
import CipherWrapperIframe from './canvasWrapper';

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

const MintPage = () => {
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

    // // Save data to localStorage
    // const saveToLocalStorage = () => {
    //     const dataToSave = {
    //         coordinates,
    //         builderGenes,
    //         walkerGene
    //     };

    //     localStorage.setItem('mintData', JSON.stringify(dataToSave));
    //     alert('Configuration saved successfully!');
    // };

    // Generate random coordinates
    const generateRandomCoordinates = () => {
        setCoordinates(generateRandomCoords());
    };

    // Load data from localStorage
    useEffect(() => {
        // const savedData = localStorage.getItem('mintData');
        // if (savedData) {
        //     try {
        //         const parsed = JSON.parse(savedData);
        //         if (parsed.coordinates) setCoordinates(parsed.coordinates);
        //         if (parsed.builderGenes) setBuilderGenes(parsed.builderGenes);
        //         if (parsed.walkerGene) setWalkerGene(parsed.walkerGene);
        //     } catch (error) {
        //         console.error('Error loading saved data:', error);
        //     }
        // }
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
                            chaosNumbers={[2, 5, 6]}
                        />
                        <div className="canvas-controls">
                            <button onClick={generateRandomCoordinates} className="random-btn">
                                RANDOMIZE COORDINATES
                            </button>
                            {/* <button onClick={saveToLocalStorage} className="save-btn">
                                SAVE CONFIGURATION
                            </button> */}
                        </div>
                    </div>

                    <div className="gene-selection">
                        <h3>TURMITE GENES</h3>

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
                </div>
            </div>

            <style jsx>{`
        .mint-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: #ff0000;
        }
        
        .mint-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        
        @media (min-width: 768px) {
          .mint-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        .canvas-section {
          background-color: #000000;
          border: 1px solid #ff0000;
          padding: 10px;
        }
        
        .canvas-controls {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }
        
        .gene-selection,
        .coordinates-section {
          background-color: #000000;
          border: 1px solid #ff0000;
          padding: 15px;
        }
        
        .gene-section {
          margin-bottom: 20px;
        }
        
        .gene-selector {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #ff0000;
        }
        
        .gene-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .gene-option {
          display: flex;
          align-items: center;
          margin-right: 15px;
        }
        
        .gene-name {
          margin-left: 5px;
        }
        
        .coordinates-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .coordinate-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .coordinate-inputs {
          display: flex;
          gap: 5px;
        }
        
        input[type="number"] {
          width: 60px;
          background-color: #000000;
          border: 1px solid #ff0000;
          color: #ff0000;
          padding: 3px;
        }
        
        input[type="radio"] {
          accent-color: #ff0000;
        }
        
        button {
          background: #000000;
          border: 1px solid #ff0000;
          color: #ff0000;
          padding: 5px 10px;
          cursor: pointer;
        }
        
        button:hover {
          background-color: #ff0000;
          color: #000000;
        }
      `}</style>
        </div>
    );
};

export default MintPage;


// import React, { useState, useEffect } from 'react';
// import CipherWrapperIframe from './canvasWrapper';

// const MintPage = () => {
//     // State for storing 15 (x,y) coordinates
//     const [coordinates, setCoordinates] = useState(Array(15).fill().map(() => ({ x: 0, y: 0 })));
//     const [showAllCoordinates, setShowAllCoordinates] = useState(false);

//     // Handle coordinate input changes
//     const handleCoordinateChange = (index, axis, value) => {
//         const newCoordinates = [...coordinates];
//         // Ensure value is a number and within canvas bounds (0-299)
//         const numValue = parseInt(value) || 0;
//         const boundedValue = Math.min(Math.max(numValue, 0), 299);

//         newCoordinates[index] = {
//             ...newCoordinates[index],
//             [axis]: boundedValue
//         };

//         setCoordinates(newCoordinates);
//     };

//     // Save coordinates to localStorage
//     const saveCoordinates = () => {
//         localStorage.setItem('mintCoordinates', JSON.stringify(coordinates));
//         alert('Coordinates saved successfully!');
//     };

//     // Load coordinates from localStorage
//     useEffect(() => {
//         const savedCoordinates = localStorage.getItem('mintCoordinates');
//         if (savedCoordinates) {
//             try {
//                 setCoordinates(JSON.parse(savedCoordinates));
//             } catch (error) {
//                 console.error('Error loading saved coordinates:', error);
//             }
//         }
//     }, []);

//     // Generate a random set of coordinates
//     const generateRandomCoordinates = () => {
//         const randomCoords = Array(15).fill().map(() => ({
//             x: Math.floor(Math.random() * 300),
//             y: Math.floor(Math.random() * 300)
//         }));
//         setCoordinates(randomCoords);
//     };

//     return (
//         <div className="mint-page">
//             <div className="mint-content">
//                 <h2>MINT YOUR TURMITE</h2>
//                 <p>Set the starting coordinates for your turmites or generate random ones</p>

//                 <div className="mint-grid">
//                     <div className="canvas-section">
//                         <CipherWrapperIframe />
//                         <div className="canvas-controls">
//                             <button onClick={generateRandomCoordinates} className="random-btn">
//                                 RANDOMIZE
//                             </button>
//                             <button onClick={saveCoordinates} className="save-btn">
//                                 SAVE COORDINATES
//                             </button>
//                         </div>
//                     </div>

//                     <div className="coordinates-section">
//                         <h3>TURMITE COORDINATES</h3>
//                         <button
//                             onClick={() => setShowAllCoordinates(!showAllCoordinates)}
//                             className="toggle-btn"
//                         >
//                             {showAllCoordinates ? "SHOW LESS" : "SHOW ALL"}
//                         </button>

//                         <div className="coordinates-list">
//                             {coordinates.slice(0, showAllCoordinates ? 15 : 5).map((coord, index) => (
//                                 <div key={index} className="coordinate-item">
//                                     <span className="coordinate-label">Turmite {index + 1}:</span>
//                                     <div className="coordinate-inputs">
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             max="299"
//                                             value={coord.x}
//                                             onChange={(e) => handleCoordinateChange(index, 'x', e.target.value)}
//                                             placeholder="X"
//                                         />
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             max="299"
//                                             value={coord.y}
//                                             onChange={(e) => handleCoordinateChange(index, 'y', e.target.value)}
//                                             placeholder="Y"
//                                         />
//                                     </div>
//                                 </div>
//                             ))}

//                             {!showAllCoordinates && coordinates.length > 5 && (
//                                 <div className="more-indicator">
//                                     {coordinates.length - 5} more turmites...
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default MintPage;