declare module 'snarkjs' {
    export const groth16: {
        fullProve(
            input: Record<string, unknown>,
            wasmFile: string,
            zkeyFile: string
        ): Promise<{ proof: unknown; publicSignals: unknown[] }>;
        exportSolidityCallData(proof: unknown, publicSignals: unknown[]): Promise<string>;
        verify(vkey: unknown, publicSignals: unknown[], proof: unknown): Promise<boolean>;
    };
}
