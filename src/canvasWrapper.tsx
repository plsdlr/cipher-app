import React, { useEffect, useRef } from 'react';
import { initCipherAnimation } from './mainTurmite.js';

const CipherWrapper: React.FC = () => {
    // Reference to store cleanup function
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        // Initialize the animation when component mounts
        const cleanup = initCipherAnimation('myCanvas');

        // Store cleanup function for later
        cleanupRef.current = cleanup;

        // Call cleanup when component unmounts
        return () => {
            if (cleanupRef.current) {
                cleanupRef.current();
            }
        };
    }, []);

    return (
        <canvas
            id="myCanvas"
            style={{
                display: 'block',
                background: 'black',
                border: '1px solid #ff0000',
                maxWidth: '100%',
                maxHeight: '100%',
                aspectRatio: '1/1',
                margin: '0 auto'
            }}
        />
    );
};

export default CipherWrapper;