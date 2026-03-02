import React, { createContext, useState, useContext, useEffect } from 'react';
// Assuming you've installed these packages in your React project
import { mulPointEscalar } from "@zk-kit/baby-jubjub";
import { crypto } from "@zk-kit/utils";
import { derivePublicKey, deriveSecretScalar } from "@zk-kit/eddsa-poseidon";
import { poseidonEncrypt } from "@zk-kit/poseidon-cipher";

// For encryption, we'll use the Web Crypto API
const encoder = new TextEncoder();

// Define types for our context
type PublicKey = [bigint, bigint]; // Public key is an array of two BigInts
type PrivateKey = Uint8Array;
type SecretScalar = bigint;
type EncryptionKey = any; // Replace with the actual type from the library
type WalletState = 'EMPTY' | 'NEEDS_RESTORE' | 'ACTIVE';

interface WalletContextType {
  // State
  walletState: WalletState;
  publicKey: PublicKey | null;
  privateKey: PrivateKey | null;
  secretScalar: SecretScalar | null;

  // Actions
  createWallet: (password: string) => Promise<boolean>;
  importWallet: (privateKeyHex: string, password: string) => Promise<boolean>;
  restoreWallet: (password: string) => Promise<boolean>;
  resetWallet: () => void;

  // Utilities (only available when ACTIVE)
  generateEncryptionKey: () => EncryptionKey | null;
  genEcdhSharedKey: (pubKey: PublicKey) => EncryptionKey | null;
  poseidonEncryption: (nonce: bigint, encryptionKey: [bigint, bigint], encodedMessage: bigint[]) => bigint[];
}

// Create context with default values
const WalletContext = createContext<WalletContextType>({
  walletState: 'EMPTY',
  publicKey: null,
  privateKey: null,
  secretScalar: null,
  createWallet: async () => false,
  importWallet: async () => false,
  restoreWallet: async () => false,
  resetWallet: () => { },
  generateEncryptionKey: () => null,
  genEcdhSharedKey: () => null,
  poseidonEncryption: () => []
});

// Helper functions
const keyGeneration = (): [PrivateKey, PublicKey] => {
  const privKey = crypto.getRandomValues(32);
  const publicKey = derivePublicKey(privKey);
  return [privKey, publicKey];
};

const generateSessionEncryptionKey = (): string => {
  const array = crypto.getRandomValues(32);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

const encryptForSession = (privateKey: Uint8Array, sessionKey: string): string => {
  const keyArray = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    keyArray[i] = parseInt(sessionKey.substring(i * 2, i * 2 + 2), 16);
  }

  const encrypted = new Uint8Array(privateKey.length);
  for (let i = 0; i < privateKey.length; i++) {
    encrypted[i] = privateKey[i] ^ keyArray[i % keyArray.length];
  }

  return btoa(String.fromCharCode.apply(null, Array.from(encrypted)));
};

const decryptFromSession = (encryptedBase64: string, sessionKey: string): Uint8Array => {
  const encryptedArray = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

  const keyArray = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    keyArray[i] = parseInt(sessionKey.substring(i * 2, i * 2 + 2), 16);
  }

  const decrypted = new Uint8Array(encryptedArray.length);
  for (let i = 0; i < encryptedArray.length; i++) {
    decrypted[i] = encryptedArray[i] ^ keyArray[i % keyArray.length];
  }

  return decrypted;
};

const generateEncryptionKey = (keyPair: [PrivateKey, PublicKey]): EncryptionKey => {
  const secretScalar = deriveSecretScalar(keyPair[0]);
  return mulPointEscalar(keyPair[1], secretScalar);
};

const createPoseidonEncryption = (nonce: bigint, encryptionKey: bigint[], encodedMessage: bigint[]): bigint[] => {
  return poseidonEncrypt(encodedMessage, [encryptionKey[0], encryptionKey[1]], nonce);
};

const genEcdhSharedKey = (privKey: PrivateKey, pubKey: PublicKey): EncryptionKey => {
  const secretScalar = deriveSecretScalar(privKey);
  return mulPointEscalar(pubKey, secretScalar);
};

// Backup/restore functions
async function deriveKeyFromPassword(password: string, salt?: Uint8Array): Promise<{ key: CryptoKey, salt: Uint8Array }> {
  const useSalt = salt ? new Uint8Array(salt) : new Uint8Array(crypto.getRandomValues(16));
  const passwordBuffer = encoder.encode(password);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: useSalt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return { key, salt: useSalt };
}

async function encryptPrivateKey(privateKey: PrivateKey, password: string): Promise<{ encryptedData: string, salt: string }> {
  const { key, salt } = await deriveKeyFromPassword(password);
  const iv = new Uint8Array(crypto.getRandomValues(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new Uint8Array(privateKey)
  );

  const encryptedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  encryptedArray.set(iv);
  encryptedArray.set(new Uint8Array(encryptedBuffer), iv.length);

  const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encryptedArray)));
  const saltBase64 = btoa(String.fromCharCode(...new Uint8Array(salt)));

  return { encryptedData, salt: saltBase64 };
}

async function decryptPrivateKey(encryptedData: string, salt: string, password: string): Promise<PrivateKey> {
  const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));

  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);

  const { key } = await deriveKeyFromPassword(password, saltBytes);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new Uint8Array(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed - likely wrong password:', error);
    throw new Error('Decryption failed - check your password');
  }
}

// Serialization helpers
const serializePublicKey = (publicKey: PublicKey): string => {
  return JSON.stringify([publicKey[0].toString(), publicKey[1].toString()]);
};


export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>('EMPTY');
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [privateKey, setPrivateKey] = useState<PrivateKey | null>(null);
  const [secretScalar, setSecretScalar] = useState<SecretScalar | null>(null);

  // Initialize wallet state on app load
  useEffect(() => {
    const initializeWallet = async () => {
      // First try to restore from session storage (user was active this session)
      const sessionKey = sessionStorage.getItem('walletSessionKey');
      const encryptedSessionPrivKey = sessionStorage.getItem('walletSessionPrivKey');

      if (sessionKey && encryptedSessionPrivKey) {
        try {
          const privateKey = decryptFromSession(encryptedSessionPrivKey, sessionKey);
          const publicKey = derivePublicKey(privateKey);
          const secretScalar = deriveSecretScalar(privateKey);

          setPublicKey(publicKey);
          setPrivateKey(privateKey);
          setSecretScalar(secretScalar);
          setWalletState('ACTIVE');

          console.log("Restored active wallet from session storage");
          return;
        } catch (error) {
          console.error('Failed to restore from session storage:', error);
          // Clear invalid session data
          sessionStorage.removeItem('walletSessionKey');
          sessionStorage.removeItem('walletSessionPrivKey');
        }
      }

      // Check if backup exists (user needs to restore with password)
      const hasBackup = localStorage.getItem('walletBackup') && localStorage.getItem('walletSalt');
      if (hasBackup) {
        setWalletState('NEEDS_RESTORE');
        console.log("Backup found - user needs to enter password");
      } else {
        setWalletState('EMPTY');
        console.log("No wallet found");
      }
    };

    initializeWallet();
  }, []);

  // Store keys in session storage and update state
  const activateWallet = (privateKey: PrivateKey, publicKey: PublicKey) => {
    const sessionKey = generateSessionEncryptionKey();
    const encryptedPrivKey = encryptForSession(privateKey, sessionKey);

    sessionStorage.setItem('walletSessionKey', sessionKey);
    sessionStorage.setItem('walletSessionPrivKey', encryptedPrivKey);

    const secretScalar = deriveSecretScalar(privateKey);

    setPublicKey(publicKey);
    setPrivateKey(privateKey);
    setSecretScalar(secretScalar);
    setWalletState('ACTIVE');
  };

  // Create backup and store in localStorage
  const createBackup = async (privateKey: PrivateKey, publicKey: PublicKey, password: string): Promise<boolean> => {
    try {
      const { encryptedData, salt } = await encryptPrivateKey(privateKey, password);
      const serializedPublicKey = serializePublicKey(publicKey);

      localStorage.setItem('walletBackup', encryptedData);
      localStorage.setItem('walletSalt', salt);
      localStorage.setItem('walletPublicKey', serializedPublicKey);

      console.log('Wallet backup created successfully');
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  };

  // Generate new wallet and force backup
  const createWallet = async (password: string): Promise<boolean> => {
    try {
      const [privateKey, publicKey] = keyGeneration();

      // Create backup first
      const backupSuccess = await createBackup(privateKey, publicKey, password);
      if (!backupSuccess) {
        return false;
      }

      // Activate wallet
      activateWallet(privateKey, publicKey);

      console.log('New wallet created and backed up successfully');
      return true;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      return false;
    }
  };

  // Import wallet from private key and force backup
  const importWallet = async (privateKeyHex: string, password: string): Promise<boolean> => {
    try {
      // Clean and validate private key
      let cleanHex = privateKeyHex.trim();
      if (cleanHex.startsWith('0x')) {
        cleanHex = cleanHex.substring(2);
      }

      if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
        throw new Error('Invalid hex format for private key');
      }

      if (cleanHex.length !== 64) {
        if (cleanHex.length > 64) {
          cleanHex = cleanHex.substring(0, 64);
        } else {
          cleanHex = cleanHex.padStart(64, '0');
        }
      }

      // Convert to Uint8Array
      const privateKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        privateKey[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
      }

      const publicKey = derivePublicKey(privateKey);

      // Create backup first
      const backupSuccess = await createBackup(privateKey, publicKey, password);
      if (!backupSuccess) {
        return false;
      }

      // Activate wallet
      activateWallet(privateKey, publicKey);

      console.log('Wallet imported and backed up successfully');
      return true;
    } catch (error) {
      console.error('Failed to import wallet:', error);
      return false;
    }
  };

  // Restore wallet from password backup
  const restoreWallet = async (password: string): Promise<boolean> => {
    const encryptedData = localStorage.getItem('walletBackup');
    const salt = localStorage.getItem('walletSalt');

    if (!encryptedData || !salt) {
      console.error('No backup found');
      return false;
    }

    try {
      const privateKey = await decryptPrivateKey(encryptedData, salt, password);
      const publicKey = derivePublicKey(privateKey);

      // Activate wallet
      activateWallet(privateKey, publicKey);

      console.log('Wallet restored successfully from backup');
      return true;
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      return false;
    }
  };

  // Reset wallet completely
  const resetWallet = () => {
    // Clear all state
    setPublicKey(null);
    setPrivateKey(null);
    setSecretScalar(null);
    setWalletState('EMPTY');

    // Clear all storage
    localStorage.removeItem('walletBackup');
    localStorage.removeItem('walletSalt');
    localStorage.removeItem('walletPublicKey');
    sessionStorage.removeItem('walletSessionKey');
    sessionStorage.removeItem('walletSessionPrivKey');

    console.log('Wallet reset completely');
  };

  // Utility functions (only work when ACTIVE)
  const createEncryptionKey = (): EncryptionKey | null => {
    if (walletState !== 'ACTIVE' || !privateKey || !publicKey) {
      return null;
    }
    return generateEncryptionKey([privateKey, publicKey]);
  };

  const createEcdhSharedKey = (pubKey: PublicKey): EncryptionKey | null => {
    if (walletState !== 'ACTIVE' || !privateKey) {
      return null;
    }
    return genEcdhSharedKey(privateKey, pubKey);
  };

  const createPoseidonEncryptionWrapper = (nonce: bigint, encryptionKey: [bigint, bigint], encodedMessage: bigint[]): bigint[] => {
    if (walletState !== 'ACTIVE') {
      return [];
    }
    return createPoseidonEncryption(nonce, encryptionKey, encodedMessage);
  };

  // Context value
  const contextValue: WalletContextType = {
    walletState,
    publicKey,
    privateKey,
    secretScalar,
    createWallet,
    importWallet,
    restoreWallet,
    resetWallet,
    generateEncryptionKey: createEncryptionKey,
    genEcdhSharedKey: createEcdhSharedKey,
    poseidonEncryption: createPoseidonEncryptionWrapper
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook to use the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
