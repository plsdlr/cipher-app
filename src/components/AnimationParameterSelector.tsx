import React from 'react';

// Valid combinations based on ratings <= 2 (German grading: 1=excellent, 2=good)
const VALID_COMBINATIONS: Record<number, Record<number, number[]>> = {
    6: {
        1: [20, 30],
        2: [5]
    },
    11: {
        1: [20, 25, 30],
        2: [5, 20, 25, 30],
        3: [5]
    },
    15: {
        1: [5, 20, 25, 30],
        2: [5, 20, 25],
        3: [5],
        4: [5, 20]
    },
    25: {
        1: [5, 30],
        2: [5, 25],
        3: [5],
        4: [5]
    }
};

interface AnimationParameterSelectorProps {
    pusherFrames: number;
    cleanerFrames: number;
    rectangleCount: number;
    onPusherChange: (value: number) => void;
    onCleanerChange: (value: number) => void;
    onRectangleChange: (value: number) => void;
    includeRectangleCount?: boolean; // Optional: to hide rectangle count if not needed
}

const AnimationParameterSelector: React.FC<AnimationParameterSelectorProps> = ({
    pusherFrames,
    cleanerFrames,
    rectangleCount,
    onPusherChange,
    onCleanerChange,
    onRectangleChange,
    includeRectangleCount = true
}) => {
    // Helper functions for validation
    const getValidCleaners = (pusher: number): number[] => {
        const cleanerMap = VALID_COMBINATIONS[pusher];
        return cleanerMap ? Object.keys(cleanerMap).map(Number) : [];
    };

    const getValidRectangles = (pusher: number, cleaner: number): number[] => {
        return VALID_COMBINATIONS[pusher]?.[cleaner] || [];
    };

    const isValidCombination = (pusher: number, cleaner: number, rect: number): boolean => {
        return VALID_COMBINATIONS[pusher]?.[cleaner]?.includes(rect) || false;
    };

    const handlePusherChange = (value: number) => {
        onPusherChange(value);
        // Auto-select first valid cleaner and rectangle
        const validCleaners = getValidCleaners(value);
        if (validCleaners.length > 0) {
            const newCleaner = validCleaners[0];
            onCleanerChange(newCleaner);
            const validRects = getValidRectangles(value, newCleaner);
            if (validRects.length > 0) {
                onRectangleChange(validRects[0]);
            }
        }
    };

    const handleCleanerChange = (value: number) => {
        onCleanerChange(value);
        // Auto-select first valid rectangle
        const validRects = getValidRectangles(pusherFrames, value);
        if (validRects.length > 0) {
            onRectangleChange(validRects[0]);
        }
    };

    return (
        <>
            {/* Pusher Slowness */}
            <div className="gene-section">
                <p>Pusher Slowness</p>
                <div className="gene-options">
                    {[6, 11, 15, 25].map((value) => {
                        const hasValidCombos = getValidCleaners(value).length > 0;
                        return (
                            <label key={`pusher-${value}`} className="gene-option">
                                <input
                                    type="radio"
                                    name="pusher-slowness"
                                    checked={pusherFrames === value}
                                    disabled={!hasValidCombos}
                                    onChange={() => handlePusherChange(value)}
                                />
                                <span className="gene-name" style={{ opacity: hasValidCombos ? 1 : 0.3 }}>
                                    {value}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Cleaner Slowness */}
            <div className="gene-section">
                <p>Cleaner Slowness</p>
                <div className="gene-options">
                    {[1, 2, 3, 4].map((value) => {
                        const isValid = getValidCleaners(pusherFrames).includes(value);
                        return (
                            <label key={`cleaner-${value}`} className="gene-option">
                                <input
                                    type="radio"
                                    name="cleaner-slowness"
                                    checked={cleanerFrames === value}
                                    disabled={!isValid}
                                    onChange={() => handleCleanerChange(value)}
                                />
                                <span className="gene-name" style={{ opacity: isValid ? 1 : 0.3 }}>
                                    {value}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Rectangle Count (optional) */}
            {includeRectangleCount && (
                <div className="gene-section">
                    <p>Rectangle Count (TEST - not encoded)</p>
                    <div className="gene-options">
                        {[5, 20, 25, 30].map((value) => {
                            const isValid = isValidCombination(pusherFrames, cleanerFrames, value);
                            return (
                                <label key={`rect-${value}`} className="gene-option">
                                    <input
                                        type="radio"
                                        name="rectangle-count"
                                        checked={rectangleCount === value}
                                        disabled={!isValid}
                                        onChange={() => onRectangleChange(value)}
                                    />
                                    <span className="gene-name" style={{ opacity: isValid ? 1 : 0.3 }}>
                                        {value}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
};

export default AnimationParameterSelector;
