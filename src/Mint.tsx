import React, { useState, useEffect } from 'react';
import CipherWrapper from './canvasWrapper';

const MintPage = () => {
    // State for storing 15 (x,y) coordinates
    const [coordinates, setCoordinates] = useState(Array(15).fill().map(() => ({ x: 0, y: 0 })));
    const [showAllCoordinates, setShowAllCoordinates] = useState(false);

    // Handle coordinate input changes
    const handleCoordinateChange = (index, axis, value) => {
        const newCoordinates = [...coordinates];
        // Ensure value is a number and within canvas bounds (0-299)
        const numValue = parseInt(value) || 0;
        const boundedValue = Math.min(Math.max(numValue, 0), 299);

        newCoordinates[index] = {
            ...newCoordinates[index],
            [axis]: boundedValue
        };

        setCoordinates(newCoordinates);
    };

    // Save coordinates to localStorage
    const saveCoordinates = () => {
        localStorage.setItem('mintCoordinates', JSON.stringify(coordinates));
        alert('Coordinates saved successfully!');
    };

    // Load coordinates from localStorage
    useEffect(() => {
        const savedCoordinates = localStorage.getItem('mintCoordinates');
        if (savedCoordinates) {
            try {
                setCoordinates(JSON.parse(savedCoordinates));
            } catch (error) {
                console.error('Error loading saved coordinates:', error);
            }
        }
    }, []);

    // Generate a random set of coordinates
    const generateRandomCoordinates = () => {
        const randomCoords = Array(15).fill().map(() => ({
            x: Math.floor(Math.random() * 300),
            y: Math.floor(Math.random() * 300)
        }));
        setCoordinates(randomCoords);
    };

    return (
        <div className="mint-page">
            <div className="mint-content">
                <h2>MINT YOUR TURMITE</h2>
                <p>Set the starting coordinates for your turmites or generate random ones</p>

                <div className="mint-grid">
                    <div className="canvas-section">
                        <CipherWrapper />
                        <div className="canvas-controls">
                            <button onClick={generateRandomCoordinates} className="random-btn">
                                RANDOMIZE
                            </button>
                            <button onClick={saveCoordinates} className="save-btn">
                                SAVE COORDINATES
                            </button>
                        </div>
                    </div>

                    <div className="coordinates-section">
                        <h3>TURMITE COORDINATES</h3>
                        <button
                            onClick={() => setShowAllCoordinates(!showAllCoordinates)}
                            className="toggle-btn"
                        >
                            {showAllCoordinates ? "SHOW LESS" : "SHOW ALL"}
                        </button>

                        <div className="coordinates-list">
                            {coordinates.slice(0, showAllCoordinates ? 15 : 5).map((coord, index) => (
                                <div key={index} className="coordinate-item">
                                    <span className="coordinate-label">Turmite {index + 1}:</span>
                                    <div className="coordinate-inputs">
                                        <input
                                            type="number"
                                            min="0"
                                            max="299"
                                            value={coord.x}
                                            onChange={(e) => handleCoordinateChange(index, 'x', e.target.value)}
                                            placeholder="X"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max="299"
                                            value={coord.y}
                                            onChange={(e) => handleCoordinateChange(index, 'y', e.target.value)}
                                            placeholder="Y"
                                        />
                                    </div>
                                </div>
                            ))}

                            {!showAllCoordinates && coordinates.length > 5 && (
                                <div className="more-indicator">
                                    {coordinates.length - 5} more turmites...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MintPage;