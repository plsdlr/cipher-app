import { useState, useEffect } from 'react';
import { useWriteContract, useReadContracts, useAccount } from 'wagmi';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from './../contractAbi';
import { parseEther } from 'viem';


// Types for our contract functions
interface ProofData {
    pA: [bigint, bigint];
    pB: [[bigint, bigint], [bigint, bigint]];
    pC: [bigint, bigint];
}

interface MintProofData extends ProofData {
    pubSignals: [bigint, bigint, bigint, bigint, bigint]; // 5 elements
}

interface TransferProofData extends ProofData {
    pubSignals: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]; // 11 elements
}

interface UseContractUtilsProps {
    contractAddress: `0x${string}`;
    chainId?: number;
}

export function useContractUtils({ contractAddress, chainId }: UseContractUtilsProps) {
    //const { address } = useAccount();
    // Getting the contract address for Sepolia testnet
    const contractABI = EncryptedNFTABI;


    // Read Functions
    const useTokenURI = (tokenId: bigint | undefined) => {
        return useReadContracts({
            address: contractAddress,
            abi: contractABI,
            functionName: 'tokenURI',
            args: tokenId !== undefined ? [tokenId] : undefined,
            enabled: tokenId !== undefined,
            chainId,
        });
    };

    const useGetTimestamp = (tokenId: bigint | undefined) => {
        return useReadContracts({
            address: contractAddress,
            abi: contractABI,
            functionName: 'getTimestamp',
            args: tokenId !== undefined ? [tokenId] : undefined,
            enabled: tokenId !== undefined,
            chainId,
        });
    };

    // Read Functions
    const useBalanceOf = (ownerAddress: `0x${string}` | undefined) => {
        return useReadContracts({
            address: contractAddress,
            abi: contractABI,
            functionName: 'balanceOf',
            args: ownerAddress ? [ownerAddress] : undefined,
            enabled: !!ownerAddress,
            chainId,
        });
    };

    const useOwnerOf = (tokenId: bigint | undefined) => {
        return useReadContracts({
            address: contractAddress,
            abi: contractABI,
            functionName: 'ownerOf',
            args: tokenId !== undefined ? [tokenId] : undefined,
            enabled: tokenId !== undefined,
            chainId,
        });
    };

    const useGetFlag = (tokenId: bigint | undefined) => {
        return useReadContracts({
            address: contractAddress,
            abi: contractABI,
            functionName: 'getFlag',
            args: tokenId !== undefined ? [tokenId] : undefined,
            enabled: tokenId !== undefined,
            chainId,
        });
    };

    const useGetEncryptedNote = (tokenId: bigint | undefined) => {
        return useReadContracts({
            address: contractAddress,
            abi: contractABI,
            functionName: 'getEncryptedNote',
            args: tokenId !== undefined ? [tokenId] : undefined,
            enabled: tokenId !== undefined,
            chainId,
            select: (data) => ({
                a: data[0],
                b: data[1],
                c: data[2],
                d: data[3],
                timestamp: data[4],
                flag: data[5],
            }),
        });
    };

    // // Write Functions
    // const useRegisterPublicKey = () => {
    //     const [state, setState] = useState({
    //         isSuccess: false,
    //         isError: false,
    //         isPending: false,
    //         error: null as Error | null,
    //         txHash: "",
    //     });

    //     const { config, error: prepareError } = usePrepareContractWrite({
    //         address: contractAddress,
    //         abi: contractABI,
    //         functionName: 'registerPublicKey',
    //         chainId,
    //     });

    //     const {
    //         write: registerWrite,
    //         data: writeData,
    //         error: writeError,
    //         isError: isWriteError,
    //         isPending: isWritePending,
    //     } = useWriteContract(config);

    //     const {
    //         isLoading: isConfirming,
    //         isSuccess,
    //         isError: isConfirmError,
    //         error: confirmError,
    //     } = useWaitForTransaction({
    //         hash: writeData?.hash,
    //     });

    //     // Update state based on transaction status
    //     useEffect(() => {
    //         setState({
    //             isSuccess,
    //             isError: isWriteError || isConfirmError,
    //             isPending: isWritePending || isConfirming,
    //             error: writeError || confirmError || null,
    //             txHash: writeData?.hash || "",
    //         });
    //     }, [isSuccess, isWriteError, isConfirmError, isWritePending, isConfirming, writeError, confirmError, writeData?.hash]);

    //     const register = async (publicKeyX: bigint, publicKeyY: bigint) => {
    //         if (!registerWrite) {
    //             throw new Error("Contract write function is not available");
    //         }

    //         registerWrite({ args: [publicKeyX, publicKeyY] });
    //     };

    //     return {
    //         register,
    //         ...state,
    //         prepareError,
    //     };
    // };

    // const useMint = () => {
    //     const [state, setState] = useState({
    //         isSuccess: false,
    //         isError: false,
    //         isPending: false,
    //         error: null as Error | null,
    //         txHash: "",
    //     });

    //     const { config, error: prepareError } = usePrepareContractWrite({
    //         address: contractAddress,
    //         abi: contractABI,
    //         functionName: 'mint',
    //         chainId,
    //     });

    //     const {
    //         write: mintWrite,
    //         data: writeData,
    //         error: writeError,
    //         isError: isWriteError,
    //         isPending: isWritePending,
    //     } = useWriteContract(config);

    //     const {
    //         isLoading: isConfirming,
    //         isSuccess,
    //         isError: isConfirmError,
    //         error: confirmError,
    //     } = useWaitForTransaction({
    //         hash: writeData?.hash,
    //     });

    //     // Update state based on transaction status
    //     useEffect(() => {
    //         setState({
    //             isSuccess,
    //             isError: isWriteError || isConfirmError,
    //             isPending: isWritePending || isConfirming,
    //             error: writeError || confirmError || null,
    //             txHash: writeData?.hash || "",
    //         });
    //     }, [isSuccess, isWriteError, isConfirmError, isWritePending, isConfirming, writeError, confirmError, writeData?.hash]);

    //     const mint = async (proofData: MintProofData, toAddress: `0x${string}`) => {
    //         if (!mintWrite) {
    //             throw new Error("Contract write function is not available");
    //         }

    //         mintWrite({
    //             args: [
    //                 proofData.pA,
    //                 proofData.pB,
    //                 proofData.pC,
    //                 proofData.pubSignals,
    //                 toAddress
    //             ]
    //         });
    //     };

    //     return {
    //         mint,
    //         ...state,
    //         prepareError,
    //     };
    // };

    // const useVerifiedTransferFrom = () => {
    //     const [state, setState] = useState({
    //         isSuccess: false,
    //         isError: false,
    //         isPending: false,
    //         error: null as Error | null,
    //         txHash: "",
    //     });

    //     const { config, error: prepareError } = usePrepareContractWrite({
    //         address: contractAddress,
    //         abi: contractABI,
    //         functionName: 'verifiedTransferFrom',
    //         chainId,
    //     });

    //     const {
    //         write: transferWrite,
    //         data: writeData,
    //         error: writeError,
    //         isError: isWriteError,
    //         isPending: isWritePending,
    //     } = useWriteContract(config);

    //     const {
    //         isLoading: isConfirming,
    //         isSuccess,
    //         isError: isConfirmError,
    //         error: confirmError,
    //     } = useWaitForTransaction({
    //         hash: writeData?.hash,
    //     });

    //     // Update state based on transaction status
    //     useEffect(() => {
    //         setState({
    //             isSuccess,
    //             isError: isWriteError || isConfirmError,
    //             isPending: isWritePending || isConfirming,
    //             error: writeError || confirmError || null,
    //             txHash: writeData?.hash || "",
    //         });
    //     }, [isSuccess, isWriteError, isConfirmError, isWritePending, isConfirming, writeError, confirmError, writeData?.hash]);

    //     const transfer = async (
    //         fromAddress: `0x${string}`,
    //         toAddress: `0x${string}`,
    //         tokenId: bigint,
    //         proofData: TransferProofData,
    //         value?: bigint
    //     ) => {
    //         if (!transferWrite) {
    //             throw new Error("Contract write function is not available");
    //         }

    //         transferWrite({
    //             args: [
    //                 fromAddress,
    //                 toAddress,
    //                 tokenId,
    //                 proofData.pA,
    //                 proofData.pB,
    //                 proofData.pC,
    //                 proofData.pubSignals
    //             ],
    //             value: value || 0n,
    //         });
    //     };

    //     return {
    //         transfer,
    //         ...state,
    //         prepareError,
    //     };
    // };

    return {
        useTokenURI,
        useGetTimestamp,
        useGetFlag,
        useGetEncryptedNote,
        useBalanceOf,
        useOwnerOf

        // useRegisterPublicKey,
        // useMint,
        // useVerifiedTransferFrom,
    };
}