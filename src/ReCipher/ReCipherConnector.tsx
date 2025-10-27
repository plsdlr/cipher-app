import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi';
import { TransactionStatus, TransactionButton } from '../components';
import { type ProofCalldata } from '../ProofSystem/ProofSystem.tsx';

import {
    type BaseError,
    useWaitForTransactionReceipt,
    useWriteContract
} from 'wagmi';

interface ReCipherNFTProps {
    calldata: ProofCalldata;
    tokenId: string;
}

export function ReCipherNFT({ calldata, tokenId }: ReCipherNFTProps) {
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

    async function submit() {
        writeContract({
            address: formattedAddress,
            abi: EncryptedNFTABI,
            functionName: 'reCipher',
            args: [calldata.a, calldata.b, calldata.c, calldata.publivInput, BigInt(tokenId)],
        })
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({
            hash,
        })

    return (
        <>
            <TransactionButton
                onClick={submit}
                isPending={isPending}
                isConfirming={isConfirming}
                idleText="ReCipher Token"
                pendingText="Submitting..."
                confirmingText="Confirming..."
            />
            <TransactionStatus
                isPending={isPending}
                isConfirming={isConfirming}
                isSuccess={isConfirmed}
                error={error ? ((error as BaseError).shortMessage || error.message) : null}
                txHash={hash}
                pendingMessage="Submitting reCipher transaction..."
                confirmingMessage="Waiting for blockchain confirmation..."
                successMessage="Token re-encrypted successfully!"
            />
        </>
    )
}


