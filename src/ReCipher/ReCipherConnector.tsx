import { useEffect, useRef } from 'react';
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
    onSuccess?: () => void;
}

export function ReCipherNFT({ calldata, tokenId, onSuccess }: ReCipherNFTProps) {
    const lastProcessedTx = useRef<string | null>(null);

    const {
        data: hash,
        error,
        isPending,
        writeContractAsync
    } = useWriteContract()

    const formattedAddress = EncryptedNFT_CONTRACT_ADDRESS[1] as `0x${string}`;

    async function submit() {
        try {
            await writeContractAsync({
                address: formattedAddress,
                abi: EncryptedNFTABI,
                functionName: 'reCipher',
                args: [calldata.a, calldata.b, calldata.c, calldata.publivInput, BigInt(tokenId)],
            })
        } catch {
            // error is captured in error from the hook
        }
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash })

    useEffect(() => {
        if (isConfirmed && hash && lastProcessedTx.current !== hash && onSuccess) {
            lastProcessedTx.current = hash;
            onSuccess();
        }
    }, [isConfirmed, hash, onSuccess]);

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


