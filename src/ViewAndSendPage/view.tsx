import React, { useState, useEffect } from 'react';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import CipherWrapperIframe from '../canvasWrapper.tsx';
import encodeAll from '../utils/encodingUtils.js';
import { useContractUtils } from './utils/utils.tsx';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/contractAbi.ts';
import { poseidonDecrypt } from '@zk-kit/poseidon-cipher';
import {
    type BaseError,
    useAccount,
    useConnect,
    useReadContract
} from 'wagmi';

import { useParams, BrowserRouter, Routes, Route, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';

import { decodeSlot1, decodeSlot1_withPadding, decodeSlot2, decodeSlot3_withPadding, decodeSlot3, decodeSlot2_withPadding, timeStamp, toBigInts } from '../utils/encodingUtils.js';


type TokenParams = {
    tokenId?: string;
}


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

    const { tokenId } = useParams<TokenParams>();
    const navigate = useNavigate();

    const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
    const formattedAddress = contractAddress as `0x${string}`;
    const { address } = useAccount();

    const encryptedNotes = useReadContract({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'getEncryptedNote',
        args: [tokenId]
    });

    // State to store decrypted data
    const [allPositions, setAllPositions] = useState(null);
    const [allRules, setAllRules] = useState(null);
    const [allAdditionalData, setAdditionalData] = useState(null);

    const [error, setError] = useState(null);

    //private key not loaded here :

    useEffect(() => {
        const decrypt = async () => {
            console.log("get hereeeeeeeeeeeeeee1")
            console.log(isGenerated)
            console.log(privateKey)
            console.log(encryptedNotes.data)
            if (isGenerated && privateKey && encryptedNotes.data && !encryptedNotes.isLoading) {
                console.log("get hereeeeeeeeeeeeeee2")
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

                    const slot1 = decodeSlot1_withPadding(fun[0]);
                    const slot2 = decodeSlot2_withPadding(fun[1]);
                    const slot3 = decodeSlot3_withPadding(fun[2]);


                    const allPositions = slot1["positions"].concat(slot2["positions"]).concat(slot3["positions"])
                    const allRulesNew = slot2["rules"].concat(slot3["rules"])
                    const additionalValues = slot3["additionalValues"]

                    console.log("From encryption:")
                    console.log(additionalValues)

                    setAllPositions(allPositions);
                    setAdditionalData([additionalValues["value1"], additionalValues["value2"], additionalValues["value3"]]);
                    setAllRules(allRulesNew);


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
            <h1>VIEWPAGE</h1>
            {/* Display your data here */}
            {allPositions && allAdditionalData && allRules && (
                <div>
                    <CipherWrapperIframe
                        coordinates={allPositions}
                        builderTurmites={allRules}
                        walkerTurmites={[allRules[3]]}
                        speed={1}
                        chaosNumbers={allAdditionalData}
                    />
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