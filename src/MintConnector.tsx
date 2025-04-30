import React, { useState } from 'react';

import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from './contractAbi';

import {
    type BaseError,
    useAccount,
    useConnect,
    useWaitForTransactionReceipt,
    useWriteContract
} from 'wagmi';


// Define props interface for the component
interface MintNFTProps {
    calldata: [];
    onMintStart?: () => void;
    onMintSuccess?: (hash: `0x${string}`) => void;
    onMintError?: (error: BaseError | Error) => void;
}

export function MintNFT({ calldata }) {
    const {
        data: hash,
        error,
        isPending,
        writeContract
    } = useWriteContract()

    // Getting the contract address for Sepolia testnet
    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];

    // Make sure the address is properly formatted as a hex string with 0x prefix
    // This is what TypeScript is expecting for the address
    const formattedAddress = contractAddress as `0x${string}`;

    console.log(formattedAddress);

    async function submit() {
        console.log(calldata);
        ///encryptedERC721.mint(pA, pB, pC, pubSignals, alice);
        console.log("get hererer")
        console.log(calldata)
        writeContract({
            address: formattedAddress,
            abi: EncryptedNFTABI,
            functionName: 'mint',
            args: [calldata.a, calldata.b, calldata.c, calldata.publivInput, "0x53064B75D3Ca0f5375860EAa5A306E9dA1A749A1"],
        })
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    return (
        <>
            <button
                disabled={isPending}
                onClick={submit}
            >
                {isPending ? 'Confirming...' : 'Mint'}
            </button>
            {hash && <div>Transaction Hash: {hash}</div>}
            {isConfirming && <div>Waiting for confirmation...</div>}
            {isConfirmed && <div>Transaction confirmed.</div>}
            {error && (
                <div>Error: {(error as BaseError).shortMessage || error.message}</div>
            )}
        </>


    )
}


