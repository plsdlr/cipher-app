import React, { useState, useEffect, useCallback } from 'react';
import { type ProofCalldata } from '../ProofSystem/ProofSystem.tsx';

export type ProofGenerationStatus = 'idle' | 'preparing' | 'generating' | 'ready' | 'error';

interface ProofGeneratorProps {
    /**
     * Function that generates the proof. Should return a ProofCalldata object.
     * This function will be called either automatically (if autoGenerate is true)
     * or manually when generateManually is called.
     */
    onGenerateProof: () => Promise<ProofCalldata>;

    /**
     * If true, automatically triggers proof generation when dependencies change.
     * If false, proof generation must be triggered manually via generateManually.
     */
    autoGenerate?: boolean;

    /**
     * Dependencies array that triggers auto-generation when changed (if autoGenerate is true).
     * Similar to useEffect dependencies.
     */
    triggerDeps?: any[];

    /**
     * Custom status messages
     */
    preparingMessage?: string;
    generatingMessage?: string;
    readyMessage?: string;
    errorMessage?: string;

    /**
     * Render prop that provides proof state and controls to children
     */
    children: (props: {
        proofCalldata: ProofCalldata | null;
        status: ProofGenerationStatus;
        error: string | null;
        generateManually: () => Promise<void>;
        reset: () => void;
    }) => React.ReactNode;
}

/**
 * Unified proof generation component that provides consistent UX across all proof generation flows.
 * Handles state management, status display, and provides both automatic and manual generation modes.
 */
export const ProofGenerator: React.FC<ProofGeneratorProps> = ({
    onGenerateProof,
    autoGenerate = false,
    triggerDeps = [],
    preparingMessage = 'Preparing to generate proof...',
    generatingMessage = 'Generating zero-knowledge proof...',
    readyMessage = 'Proof generated successfully!',
    errorMessage,
    children,
}) => {
    const [proofCalldata, setProofCalldata] = useState<ProofCalldata | null>(null);
    const [status, setStatus] = useState<ProofGenerationStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const generateProof = useCallback(async () => {
        try {
            setStatus('preparing');
            setError(null);

            // Small delay to show preparing state
            await new Promise(resolve => setTimeout(resolve, 300));

            setStatus('generating');

            const proof = await onGenerateProof();

            setProofCalldata(proof);
            setStatus('ready');
        } catch (err: any) {
            console.error('Error generating proof:', err);
            setError(err?.message || 'Unknown error occurred during proof generation');
            setStatus('error');
        }
    }, [onGenerateProof]);

    const generateManually = useCallback(async () => {
        await generateProof();
    }, [generateProof]);

    const reset = useCallback(() => {
        setProofCalldata(null);
        setStatus('idle');
        setError(null);
    }, []);

    // Auto-generate when dependencies change (if enabled)
    useEffect(() => {
        if (autoGenerate && status === 'idle') {
            generateProof();
        }
    }, [autoGenerate, ...triggerDeps]);

    // Reset proof when dependencies change in manual mode (after proof is ready)
    useEffect(() => {
        if (!autoGenerate && (status === 'ready' || status === 'error')) {
            reset();
        }
    }, [...triggerDeps]);

    return (
        <>
            {/* Status Display */}
            {status !== 'idle' && (
                <div className={`proof-status proof-status-${status}`}>
                    <div className="status-indicator">
                        {(status === 'preparing' || status === 'generating') && (
                            <div className="spinner"></div>
                        )}
                        {status === 'ready' && '✓'}
                        {status === 'error' && '✗'}
                    </div>
                    <span className="status-message">
                        {status === 'preparing' && preparingMessage}
                        {status === 'generating' && generatingMessage}
                        {status === 'ready' && readyMessage}
                        {status === 'error' && (errorMessage || error)}
                    </span>
                </div>
            )}

            {/* Proof public inputs display (when ready) */}
            {status === 'ready' && proofCalldata && (
                <div className="proof-inputs-display">
                    <p className="proof-inputs-label">Proof Generated! Public Inputs:</p>
                    {proofCalldata.publivInput.map((input, index) => (
                        <div key={index} className="proof-input-item">
                            {typeof input === 'string' ? input.substr(0, 7) : String(input).substr(0, 7)}...
                        </div>
                    ))}
                </div>
            )}

            {/* Render children with proof state */}
            {children({
                proofCalldata,
                status,
                error,
                generateManually,
                reset,
            })}
        </>
    );
};
