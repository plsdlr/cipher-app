import React, { useState, useEffect } from 'react';
import { useWallet } from './cipherWallet';
import encodeAll from './encodingUtils.js';
import { useContractUtils } from './utils/utils.tsx';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from './contractAbi';
import { poseidonDecrypt } from '@zk-kit/poseidon-cipher';
import {
    type BaseError,
    useAccount,
    useConnect,
    useReadContract
} from 'wagmi';

import { decodeSlot1, decodeSlot1_withPadding, decodeSlot2, decodeSlot3_withPadding, decodeSlot3, decodeSlot2_withPadding, timeStamp, toBigInts } from './encodingUtils.js';


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
    const formattedAddress = contractAddress as `0x${string}`;
    const { address } = useAccount();

    const awnser = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'ownerOf',
        args: ["2"]
    });

    const encryptedNotes = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'getEncryptedNote',
        args: ["2"]
    });

    // State to store decrypted data
    const [decryptedData, setDecryptedData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const decrypt = async () => {
            if (isGenerated && privateKey && encryptedNotes.data && !encryptedNotes.isLoading) {
                try {
                    const newEncryptionKey = generateEncryptionKey();
                    const timeStamp = encryptedNotes.data[4];

                    // Import poseidonDecrypt if not already imported

                    const fun = poseidonDecrypt(
                        [
                            encryptedNotes.data[0],
                            encryptedNotes.data[1],
                            encryptedNotes.data[2],
                            encryptedNotes.data[3]
                        ],
                        newEncryptionKey,
                        timeStamp,
                        3
                    );



                    console.log('Decrypted data:', fun);
                    //setDecryptedData(fun);
                    const slot1 = decodeSlot1_withPadding(fun[0]);
                    // console.log("slot1")
                    // console.log(slot1);
                    const slot2 = decodeSlot2_withPadding(fun[1]);
                    // console.log("slot2")
                    // console.log(slot2);

                    const slot3 = decodeSlot3_withPadding(fun[2]);
                    // console.log("slot3")
                    // console.log(slot3);

                    const allPositions = slot1["positions"].concat(slot2["positions"]).concat(slot3["positions"])
                    const allRules = slot2["rules"].concat(slot3["rules"])
                    const additionalValues = slot3["additionalValues"]
                    console.log(allPositions)
                    console.log(allRules)
                    console.log(additionalValues)
                } catch (err) {
                    console.error('Decryption error:', err);
                    setError(err.message);
                }
            }
        };

        decrypt();
    }, [isGenerated, encryptedNotes.data, encryptedNotes.isLoading]);

    // Loading state
    if (encryptedNotes.isLoading) {
        return <div>Loading encrypted data...</div>;
    }

    // Error state
    if (encryptedNotes.error) {
        return <div>Error loading data: {encryptedNotes.error.message}</div>;
    }

    return (
        <div>
            <h1>View Page</h1>
            {/* Display your data here */}
            {decryptedData && (
                <div>
                    <h2>Decrypted Data:</h2>
                    <pre>{JSON.stringify(decryptedData, null, 2)}</pre>
                </div>
            )}
            {error && (
                <div style={{ color: 'red' }}>
                    Error decrypting: {error}
                </div>
            )}
        </div>
    );
};

export default ViewPage