import React from 'react';

const Home = () => {
    return (
        <div className="home-container">
            <fieldset className="terminal-fieldset">
                <legend>Welcome</legend>
                <section className="hero-section">
                    <h1 className="hero-title">Welcome to Cipher</h1>
                    <p className="hero-subtitle">
                        An zero-knowlege encrypted digital artwork and protocoll. Ciphers are onchain verifiable encrypted erc721 like assets. Think of them like encrypted nfts on eth.
                    </p>
                </section>

                <section className="features-section">
                    <div className="features-list">
                        <div className="feature-item">
                            <h3>MINT</h3>
                            <p>Create unique Ciphers with customizable turmite patterns and colors. This Ciphers is verifiable encrypted and can only be seen by you.</p>
                        </div>

                        <div className="feature-item">
                            <h3>VIEW / SEND</h3>
                            <p>Manage your Cipher collection. View your tokens, transfer them to other addresses, or explore their unique properties.</p>
                        </div>

                        <div className="feature-item">
                            <h3>RE-CIPHER</h3>
                            <p>Transform your existing Ciphers by applying new turmite patterns. Create evolved versions while maintaining provenance.</p>
                        </div>

                        <div className="feature-item">
                            <h3>NIGHTMARKET</h3>
                            <p>Trade Ciphers. Connect with other collectors in the decentralized marketplace.</p>
                        </div>
                    </div>
                </section>

                <section className="getting-started">
                    <h2>Getting Started</h2>
                    <ol className="steps-list">
                        <li>Connect your wallet using the sidebar on the right</li>
                        <li>Create a cipher key using the sidebar and back it up</li>
                        <li>Navigate to MINT to create your first Cipher NFT</li>
                        <li>Customize your turmite genes and color palette</li>
                        <li>Generate proof and mint your unique creation</li>
                    </ol>
                </section>

                <section className="info-section">
                    <h2>What is Ciper?</h2>
                    <p>
                        Cipher is a artistic experiment in protocol design. It makes heavy use of zero-knolege proofs and smart contracts to enable encrypted digital artworks on eth. Each cipher is a erc721 like token with onchain stored encrypted code for a generative turmite artwork. Transfering these token involves verfiable encrypting them. The owner of a token can also RE-CIPHER it making the artwork truly unknowable even to previos owners by changing the parameters of the encrypted artwork.
                    </p>

                    <h2>How does it work?</h2>
                    <p>
                        Alice want to send a Cipher to Bob. Alice knows the Public Ethereum Address of Bob. Bob has also saved his public Cipher Key onchain. Alice generates via Diffie–Hellman a shared key (using her private cipher key and Bobs public cipher key saved onchain). She encrypts the data and with the key and generates a zero knowlege proof. (using poseidon encryption). She sends a transaction with the proof to the cipher smart contract. The cipher smart contract checks the coorectness of the proof and saves the public input which contains the encrypted data. The nft like asset changes now the owner but Alice proofed also that Bob can encrypt the Data.
                    </p>
                </section>
            </fieldset>
        </div >
    );
};

export default Home;
