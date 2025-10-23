import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi';
import { TransactionStatus, TransactionButton } from '../components';

import {
    type BaseError,
    useAccount,
    useWaitForTransactionReceipt,
    useWriteContract
} from 'wagmi';



export function MintNFT({ calldata }) {
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

    return (
        <>
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
        </>
    )
}


