import { useState, useEffect } from 'react';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { OnboardingModal } from './OnboardingModal';
import CipherWrapperIframe from '../canvasWrapper';

// Generate deterministic coordinates for examples
const generateCoordinates = (seed: number) => {
    const coords = [];
    for (let i = 0; i < 20; i++) {
        coords.push({
            x: ((seed * (i + 1) * 17) % 256),
            y: ((seed * (i + 1) * 23) % 256)
        });
    }
    return coords;
};

// Example turmite configurations with different seeds
// Turmite rules are 24-char hex strings encoding state transitions
const TURMITE_EXAMPLES = [
    {
        name: 'Spiral',
        walkerTurmites: ['ff0000ff0801000000000200'],
        builderTurmites: ['ff0800ff0201ff0800000001'],
        chaosNumbers: [11, 5, 30],
        color: 0,
        coordinates: generateCoordinates(42)
    },
    {
        name: 'Chaos',
        walkerTurmites: ['ff0001000200000200000200'],
        builderTurmites: ['ff0201000201ff0400000000'],
        chaosNumbers: [8, 3, 20],
        color: 5,
        coordinates: generateCoordinates(137)
    },
    {
        name: 'Highway',
        walkerTurmites: ['ff0001ff0201ff0000ff0800'],
        builderTurmites: ['ff0001000001ff0801000000'],
        chaosNumbers: [15, 2, 15],
        color: 10,
        coordinates: generateCoordinates(256)
    }
];

const Home = () => {
    const { needsOnboarding, dismissOnboarding } = useOnboardingStatus();
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedExample, setSelectedExample] = useState(0);

    // Sync with hook state when it updates (after initial localStorage check)
    useEffect(() => {
        setShowOnboarding(needsOnboarding);
    }, [needsOnboarding]);

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
    };

    const handleOnboardingDismiss = () => {
        dismissOnboarding();
        setShowOnboarding(false);
    };

    return (
        <div className="home-container">
            {showOnboarding && (
                <OnboardingModal
                    onComplete={handleOnboardingComplete}
                    onDismiss={handleOnboardingDismiss}
                />
            )}

            <fieldset className="terminal-fieldset">
                <legend>Welcome</legend>

                {/* <section className="features-section">
                    <pre>{`
❚❚❚❚❚  ❚  ❚❚❚❚❚  ❚   ❚  ❚❚❚❚❚  ❚❚❚❚❚
❚      ❚  ❚   ❚  ❚   ❚  ❚      ❚   ❚
❚      ❚  ❚❚❚❚❚  ❚❚❚❚❚  ❚❚❚❚❚  ❚❚❚❚❚
❚      ❚  ❚      ❚   ❚  ❚      ❚ ❚
❚❚❚❚❚  ❚  ❚      ❚   ❚  ❚❚❚❚❚  ❚  ❚❚  v.0.1
`}</pre>
                </section> */}

                <div className="cipher">
                    <h3>Cipher V0.1</h3>
                </div>



                <section className="features-section">
                    <p>
                        Cipher is a a zero-knowlege encrypted digital artwork and protocol. Ciphers are onchain verifiable encrypted erc721 like assets. Think of them like encrypted nfts on eth.
                    </p>
                </section>


                <div className="home-split-section">
                    <fieldset className="terminal-fieldset example-fieldset">
                        <legend>Examples</legend>
                        <div className="turmite-example-selector">
                            {TURMITE_EXAMPLES.map((example, index) => (
                                <label key={index} className="radio-label">
                                    <input
                                        type="radio"
                                        name="turmite-example"
                                        checked={selectedExample === index}
                                        onChange={() => setSelectedExample(index)}
                                    />
                                    {example.name}
                                </label>
                            ))}
                        </div>
                        <div className="turmite-preview">
                            <CipherWrapperIframe
                                coordinates={TURMITE_EXAMPLES[selectedExample].coordinates}
                                walkerTurmites={TURMITE_EXAMPLES[selectedExample].walkerTurmites}
                                builderTurmites={TURMITE_EXAMPLES[selectedExample].builderTurmites}
                                chaosNumbers={TURMITE_EXAMPLES[selectedExample].chaosNumbers}
                                color={TURMITE_EXAMPLES[selectedExample].color}
                                hideControls
                            />
                        </div>
                    </fieldset>

                    <fieldset className="terminal-fieldset features-fieldset">
                        <legend>Features</legend>
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
                    </fieldset>
                </div>

                {/* <section className="getting-started">
                    <h2>Getting Started</h2>
                    <ol className="steps-list">
                        <li>Connect your wallet using the sidebar on the right</li>
                        <li>Create a cipher key using the sidebar and back it up</li>
                        <li>Navigate to MINT to create your first Cipher NFT</li>
                        <li>Customize your turmite genes and color palette</li>
                        <li>Generate proof and mint your unique creation</li>
                    </ol>
                </section> */}

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
