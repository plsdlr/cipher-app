import { useEffect, useRef } from 'react';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi';
import { TransactionStatus, TransactionButton, RequireWallets } from '../components';
import { type ProofCalldata } from '../ProofSystem/ProofSystem.tsx';

import {
    type BaseError,
    useAccount,
    useWaitForTransactionReceipt,
    useWriteContract
} from 'wagmi';

interface MintNFTProps {
    calldata: ProofCalldata;
    onSuccess?: () => void;
}

export function MintNFT({ calldata, onSuccess }: MintNFTProps) {
    // Ref to track processed transaction and prevent duplicate callbacks
    const lastProcessedTx = useRef<string | null>(null);

    const {
        data: hash,
        error,
        isPending,
        writeContract
    } = useWriteContract()

    const { address } = useAccount();

    // Getting the contract address for Sepolia testnet
    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];

    // Make sure the address is properly formatted as a hex string with 0x prefix
    // This is what TypeScript is expecting for the address
    const formattedAddress = contractAddress as `0x${string}`;

    async function submit() {
        if (!address) {
            console.error("Ethereum wallet not connected");
            return;
        }

        writeContract({
            address: formattedAddress,
            abi: EncryptedNFTABI,
            functionName: 'mint',
            args: [calldata.a, calldata.b, calldata.c, calldata.publivInput, address],
            value: BigInt(100000000000000000), // 0.1 ether in wei
        })
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    // Call onSuccess callback when mint is confirmed (only once per transaction)
    useEffect(() => {
        if (isConfirmed && hash && lastProcessedTx.current !== hash && onSuccess) {
            lastProcessedTx.current = hash;
            onSuccess();
        }
    }, [isConfirmed, hash, onSuccess]);

    return (
        <RequireWallets>
            <TransactionButton
                onClick={submit}
                isPending={isPending}
                isConfirming={isConfirming}
                idleText="Mint"
                pendingText="Submitting..."
                confirmingText="Confirming..."
            />
            <TransactionStatus
                isPending={isPending}
                isConfirming={isConfirming}
                isSuccess={isConfirmed}
                error={error ? ((error as BaseError).shortMessage || error.message) : null}
                txHash={hash}
                pendingMessage="Submitting mint transaction..."
                confirmingMessage="Waiting for blockchain confirmation..."
                successMessage="NFT minted successfully!"
            />
        </RequireWallets>
    )
}


