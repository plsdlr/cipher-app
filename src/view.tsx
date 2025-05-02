import React, { useState, useEffect } from 'react';
import { useWallet } from './cipherWallet';
import encodeAll from './encodingUtils.js';
import { useContractUtils } from './utils/utils.tsx';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from './contractAbi';
import {
    type BaseError,
    useAccount,
    useConnect,
} from 'wagmi';


const ViewPage = () => {

    const {
        publicKey,
        privateKey,
        isGenerated,
        isBackedUp,
        generateEncryptionKey,
        poseidonEncryption,
        secretScalar
    } = useWallet();


    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];

    // Make sure the address is properly formatted as a hex string with 0x prefix
    // This is what TypeScript is expecting for the address
    const formattedAddress = contractAddress as `0x${string}`;

    const { address } = useAccount();

    const {
        useTokenURI,
        useGetTimestamp,
        useGetFlag,
        useGetEncryptedNote,
        useBalanceOf,
        useOwnerOf
    } = useContractUtils({ contractAddress: formattedAddress, chainId: 11155111 });

    // const contractUtils = useContractUtils({ contractAddress: formattedAddress, chainId: 11155111 });
    // console.log(contractUtils);

    const { data: balanceData, isLoading: loadingBalance } = useBalanceOf("0x53064B75D3Ca0f5375860EAa5A306E9dA1A749A1");

    console.log(balanceData);


    return (
        <>
            "helooooooo"
            {balanceData}
        </>
    )


}

export default ViewPage