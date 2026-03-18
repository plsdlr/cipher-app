import { useEffect, useRef, useState } from 'react';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi';
import { CipherMinterABI, CipherMinter_CONTRACT_ADDRESS } from '../contractABI/CipherMinter/contractAbi';
import { TransactionStatus, TransactionButton, RequireWallets } from '../components';
import { type ProofCalldata } from '../ProofSystem/ProofSystem.tsx';

import {
    type BaseError,
    useAccount,
    useReadContract,
    useWaitForTransactionReceipt,
    useWriteContract
} from 'wagmi';

interface MintNFTProps {
    calldata: ProofCalldata;
    onSuccess?: () => void;
}

export function MintNFT({ calldata, onSuccess }: MintNFTProps) {
    const lastProcessedTx = useRef<string | null>(null);

    const { address } = useAccount();

    const minterAddress = CipherMinter_CONTRACT_ADDRESS[11155111] as `0x${string}`;
    const nftAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111] as `0x${string}`;

    // Fetch allowlist signature from static JSON served at /allowlist.json
    const [allowlistSig, setAllowlistSig] = useState<`0x${string}` | null>(null);

    useEffect(() => {
        if (!address) {
            setAllowlistSig(null);
            return;
        }
        fetch('/allowlist.json')
            .then(r => r.json())
            .then((data: Record<string, string>) => {
                const sig = data[address.toLowerCase()] ?? null;
                setAllowlistSig(sig as `0x${string}` | null);
            })
            .catch(() => setAllowlistSig(null));
    }, [address]);

    // Check on-chain if this address already used its allowlist spot
    const { data: allowlistUsed } = useReadContract({
        address: minterAddress,
        abi: CipherMinterABI,
        functionName: 'allowlistUsed',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    // Read discounted allowlist price from minter
    const { data: allowlistPrice } = useReadContract({
        address: minterAddress,
        abi: CipherMinterABI,
        functionName: 'ALLOWLIST_PRICE',
    });

    // Read public price from NFT contract (source of truth)
    const { data: publicPrice } = useReadContract({
        address: nftAddress,
        abi: EncryptedNFTABI,
        functionName: 'price',
    });

    const canMintDiscounted = !!allowlistSig && !allowlistUsed;

    const {
        data: hash,
        error,
        isPending,
        writeContractAsync
    } = useWriteContract();

    async function submit() {
        if (!address) return;

        try {
            if (canMintDiscounted && allowlistSig && allowlistPrice != null) {
                await writeContractAsync({
                    address: minterAddress,
                    abi: CipherMinterABI,
                    functionName: 'mintAllowlist',
                    args: [calldata.a, calldata.b, calldata.c, calldata.publivInput, address, allowlistSig],
                    value: allowlistPrice as bigint,
                    gas: BigInt(3_000_000),
                });
            } else if (publicPrice != null) {
                await writeContractAsync({
                    address: minterAddress,
                    abi: CipherMinterABI,
                    functionName: 'mint',
                    args: [calldata.a, calldata.b, calldata.c, calldata.publivInput, address],
                    value: publicPrice as bigint,
                    gas: BigInt(3_000_000),
                });
            }
        } catch {
            // error is captured in error from the hook
        }
    }

    const { isLoading: isConfirming, isSuccess: isConfirmed } =
        useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isConfirmed && hash && lastProcessedTx.current !== hash && onSuccess) {
            lastProcessedTx.current = hash;
            onSuccess();
        }
    }, [isConfirmed, hash, onSuccess]);

    const mintLabel = canMintDiscounted ? 'Mint (Allowlist)' : 'Mint';

    const currentPrice = canMintDiscounted ? allowlistPrice : publicPrice;
    const priceEth = currentPrice != null
        ? (Number(currentPrice as bigint) / 1e18).toString()
        : null;

    return (
        <RequireWallets>
            {priceEth !== null && (
                <p className="mint-price">Price: {priceEth} ETH{canMintDiscounted ? ' (allowlist)' : ''}</p>
            )}
            <TransactionButton
                onClick={submit}
                isPending={isPending}
                isConfirming={isConfirming}
                idleText={mintLabel}
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
    );
}
