import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { OnboardingModal } from './OnboardingModal';
import CipherWrapperIframe from '../canvasWrapper';
import mintValues1 from './mint-values-1768387749712.json';
import mintValues2 from './mint-values-1768388277534.json';
import mintValues3 from './mint-values-1768389083964.json';

const TURMITE_EXAMPLES = [
    {
        name: "ONE",
        walkerTurmites: [mintValues3.walkerGene.rule],
        builderTurmites: mintValues3.builderGenes.map(g => g.rule),
        chaosNumbers: mintValues3.chaosNumbers,
        color: mintValues3.color,
        coordinates: mintValues3.coordinates
    },
    {
        name: "TWO",
        walkerTurmites: [mintValues2.walkerGene.rule],
        builderTurmites: mintValues2.builderGenes.map(g => g.rule),
        chaosNumbers: mintValues2.chaosNumbers,
        color: mintValues2.color,
        coordinates: mintValues2.coordinates
    },
    {
        name: "THREE",
        walkerTurmites: [mintValues1.walkerGene.rule],
        builderTurmites: mintValues1.builderGenes.map(g => g.rule),
        chaosNumbers: mintValues1.chaosNumbers,
        color: mintValues1.color,
        coordinates: mintValues1.coordinates
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
                    <h3>Cipher v0.1</h3>
                </div>

                {/* Imagine an artwork that is invisible to everyone but you. Not displayed in a gallery or a museum, not stored on a server, not hosted anywhere — but reconstructed and decrypted from onchain data and a key that only exists on your machine. How would it feel to view something that can only be viewed by you, in this very moment? It's intimate and perhaps unusual. A creeping sense that you might never have experienced with digital art? */}

                <section className="features-section">
                    <p>
                        Imagine something made for no one's eyes but yours. Not locked away but encrypted. Reconstructed from the chain each time you look, from a key that exists only with you. There is no gallery. No server. No other viewer.
                    </p>
                    <p>
                        Now imagine passing it on. You'd still carry the memory of it — but what if every owner could reach inside and change it before letting go? It would have to be generative then. Deterministic in its rules, yet unknowable to anyone who no longer holds the key. Each transfer like a letter no one else can open — resealed for the next owner, the previous version gone forever. A lineage written in secrets. Provable onchain. Invisible everywhere else.
                    </p>
                    <p>
                        That's Cipher.
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
                            />
                        </div>
                    </fieldset>

                    <fieldset className="terminal-fieldset features-fieldset">
                        <legend>Features</legend>
                        <div className="features-list">
                            <div className="feature-item">
                                <h3><Link to="/mint">MINT</Link></h3>
                                <p>Pick your turmite rules, pick your colors, mint. Your Cipher gets encrypted onchain — only your wallet can unlock what's inside.</p>
                            </div>

                            <div className="feature-item">
                                <h3><Link to="/view">VIEW / SEND</Link></h3>
                                <p>Browse your collection, decrypt your art, or send a Cipher to someone else. Transfers are cryptographically verified — no trust required.</p>
                            </div>

                            <div className="feature-item">
                                <h3><Link to="/view">RE-CIPHER</Link></h3>
                                <p>Swap out the turmite rules, tweak the combination, make it yours again. Even the previous owner can't know what it looks like now — the history stays onchain, the secret stays with you.</p>
                            </div>

                            <div className="feature-item">
                                <h3><Link to="/market">NIGHTMARKET</Link></h3>
                                <p>Buy and sell Ciphers without revealing what's inside. The market is onchain, the art stays private.</p>
                            </div>
                        </div>
                    </fieldset>
                </div>

                <section className="info-section">
                    <h2>What is Cipher?</h2>
                    <p>
                        Cipher is an encrypted generative art protocol on Ethereum. Each Cipher is a verifiable encrypted token. At its core, it's an artistic experiment in protocol design — using zero-knowledge proofs and smart contracts to keep generative artworks encrypted onchain, so only the current owner can see what they hold.
                    </p>
                    <p>
                        Each Cipher is driven by a set of <strong>turmites</strong> — tiny agents that crawl across a grid following fixed rules, painting as they go. Turmites are a type of 2D Turing machine: each one has a direction, a state, and a simple lookup table that tells it what color to paint the current cell, which way to turn, and what state to move into next. From just a handful of rules per turmite, they trace out wildly complex, often beautiful paths — unpredictable in appearance but fully deterministic.
                    </p>
                    <p>
                        When you mint a Cipher, you're composing a collection of turmite rulesets and a color palette. The combination of multiple turmites running together is what shapes the final artwork. The encoded parameters get encrypted with your public Cipher key and stored onchain. Transferring a Cipher re-encrypts it for the new owner. Re-Ciphering swaps a single parameter — making the artwork unknowable even to whoever held it before.
                    </p>

                    <h2>How does it work?</h2>
                    <p>
                        Say Alice wants to send a Cipher to Bob. Bob has already registered his public Cipher key onchain. Alice uses Diffie–Hellman to derive a shared secret from her private Cipher key and Bob's public key. She encrypts the artwork data with that shared secret using Poseidon encryption, then generates a zero-knowledge proof that the encryption was done correctly — without revealing the data itself.
                    </p>
                    <p>
                        She submits the proof in a transaction to the Cipher contract. The contract verifies it and updates the token's owner and encrypted payload. Bob can now decrypt it with his private key. Alice proved the handoff was valid without either party trusting the other.
                    </p>
                    <p>For a full technical explanation see the <Link to="/specs">protocol specs →</Link></p>
                </section>
            </fieldset>
        </div >
    );
};

export default Home;
