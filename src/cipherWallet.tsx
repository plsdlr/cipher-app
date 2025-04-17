import React, { createContext, useState, useContext, useEffect } from 'react';
// Assuming you've installed these packages in your React project
import { Point, mulPointEscalar } from "@zk-kit/baby-jubjub";
import { crypto } from "@zk-kit/utils";
import { derivePublicKey, deriveSecretScalar } from "@zk-kit/eddsa-poseidon";
import { poseidonEncrypt, poseidonDecrypt, poseidonDecryptWithoutCheck } from "@zk-kit/poseidon-cipher";


// For encryption, we'll use the Web Crypto API
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Define types for our context
type PublicKey = [BigInt, BigInt]; // Public key is an array of two BigInts
type PrivateKey = Uint8Array;
type SecretScalar = BigInt;
type EncryptionKey = any; // Replace with the actual type from the library

interface WalletContextType {
  publicKey: PublicKey | null;
  privateKey: PrivateKey | null;
  secretScalar: SecretScalar | null;
  isGenerated: boolean;
  isBackedUp: boolean;
  generateKeys: () => { privateKey: PrivateKey; publicKey: PublicKey };
  importPrivateKey: (privateKeyHex: string) => { privateKey: PrivateKey; publicKey: PublicKey } | null;
  hasGeneratedKeys: () => boolean;
  resetWallet: () => void;
  generateEncryptionKey: () => EncryptionKey | null;
  genEcdhSharedKey: (pubKey: PublicKey) => EncryptionKey | null;
  backupWallet: (password: string) => Promise<boolean>;
  restoreWallet: (password: string) => Promise<boolean>;
  hasBackup: () => boolean;
  poseidonEncryption: (nonce: bigint, encryptionKey: [bigint, bigint], encodedMessage: bigint[]) => bigint[];
}

// Create context with default values
const WalletContext = createContext<WalletContextType>({
  publicKey: null,
  privateKey: null,
  secretScalar: null,
  isGenerated: false,
  isBackedUp: false,
  generateKeys: () => ({ privateKey: new Uint8Array(), publicKey: [BigInt(0), BigInt(0)] }),
  importPrivateKey: () => null,
  hasGeneratedKeys: () => false,
  resetWallet: () => { },
  generateEncryptionKey: () => null,
  genEcdhSharedKey: () => null,
  backupWallet: async () => false,
  restoreWallet: async () => false,
  hasBackup: () => false,
  poseidonEncryption: (nonce: bigint, encryptionKey: bigint[], encodedMessage: bigint[]) => {
    return [];
  }
});

// Helper functions adapted from the provided code
const keyGeneration = (): [PrivateKey, PublicKey] => {
  const privKey = crypto.getRandomValues(32);
  const publicKey = derivePublicKey(privKey);
  return [privKey, publicKey];
};

const generateEncryptionKey = (keyPair: [PrivateKey, PublicKey]): EncryptionKey => {
  const secretScalar = deriveSecretScalar(keyPair[0]);
  return mulPointEscalar(keyPair[1], secretScalar);
};

const createPoseidonEncryption = (nonce: bigint, encryptionKey: bigint[], encodedMessage: bigint[]): bigint[] => {
  const messages = poseidonEncrypt(encodedMessage, [encryptionKey[0], encryptionKey[1]], nonce)
  return messages;
}


const genEcdhSharedKey = (privKey: PrivateKey, pubKey: PublicKey): EncryptionKey => {
  const secretScalar = deriveSecretScalar(privKey);
  return mulPointEscalar(pubKey, secretScalar);
};

// Helpers for private key encryption/decryption using Web Crypto API
async function deriveKeyFromPassword(password: string, salt?: Uint8Array): Promise<{ key: CryptoKey, salt: Uint8Array }> {
  // Generate salt if not provided
  const useSalt = salt || crypto.getRandomValues(16);

  // Convert password to key material
  const passwordBuffer = encoder.encode(password);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive a key using PBKDF2
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
  // Derive key from password
  const { key, salt } = await deriveKeyFromPassword(password);

  // Generate random IV
  const iv = crypto.getRandomValues(12);

  // Encrypt the private key
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    privateKey
  );

  // Combine IV and encrypted data for storage
  const encryptedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  encryptedArray.set(iv);
  encryptedArray.set(new Uint8Array(encryptedBuffer), iv.length);

  // Convert to Base64 for storage
  const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encryptedArray)));
  const saltBase64 = btoa(String.fromCharCode(...new Uint8Array(salt)));

  return { encryptedData, salt: saltBase64 };
}

async function decryptPrivateKey(encryptedData: string, salt: string, password: string): Promise<PrivateKey> {
  // Convert from Base64
  const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const saltBytes = Uint8Array.from(atob(salt), c => c.charCodeAt(0));

  // Extract IV (first 12 bytes)
  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);

  // Derive key from password using stored salt
  const { key } = await deriveKeyFromPassword(password, saltBytes);

  // Decrypt the private key
  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      ciphertext
    );

    return new Uint8Array(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed - likely wrong password:', error);
    throw new Error('Decryption failed - check your password');
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<{
    publicKey: PublicKey | null;
    privateKey: PrivateKey | null;
    secretScalar: SecretScalar | null;
    isGenerated: boolean;
    isBackedUp: boolean;
  }>({
    publicKey: null,
    privateKey: null,
    secretScalar: null,
    isGenerated: false,
    isBackedUp: false
  });

  // Check local storage for existing public key and backup status on initial load
  useEffect(() => {
    const storedPublicKey = localStorage.getItem('walletPublicKey');
    console.log(storedPublicKey);
    const hasBackup = localStorage.getItem('walletBackup') !== null;

    if (storedPublicKey) {
      try {
        const publicKey = deserializePublicKey(storedPublicKey);
        console.log("Restored public key from localStorage:", publicKey);

        setWallet(prevWallet => ({
          ...prevWallet,
          publicKey,
          isGenerated: true,
          isBackedUp: hasBackup,
        }));
      } catch (error) {
        console.error('Failed to restore public key from localStorage:', error);
        localStorage.removeItem('walletPublicKey');
      }
    }
  }, []);


  // Serialize and deserialize functions for BigInt storage
  const serializePublicKey = (publicKey: PublicKey): string => {
    // Convert BigInts to strings for JSON serialization (JSON doesn't support BigInt directly)
    return JSON.stringify([publicKey[0].toString(), publicKey[1].toString()]);
  };

  const deserializePublicKey = (serializedKey: string): PublicKey => {
    try {
      // Convert the serialized string back to a PublicKey array of BigInts
      const parsed = JSON.parse(serializedKey);
      return [BigInt(parsed[0]), BigInt(parsed[1])];
    } catch (error) {
      console.error("Error deserializing public key:", error);
      throw error;
    }
  }

  // Generate new key pair using the provided function
  const generateKeys = () => {
    const [privateKey, publicKey] = keyGeneration();
    console.log("Generated new keys - publicKey:", publicKey);

    setWallet({
      publicKey,
      privateKey,
      isGenerated: true,
      isBackedUp: false,
      secretScalar: deriveSecretScalar(privateKey)
    });
    console.log("add secret scala here")
    console.log(deriveSecretScalar(privateKey))
  };


  // Backup the private key with password encryption
  const backupWallet = async (password: string): Promise<boolean> => {
    if (!wallet.privateKey || !wallet.publicKey) {
      console.error('Cannot backup wallet: No private key available');
      return false;
    }

    try {
      // Encrypt the private key with the password
      const { encryptedData, salt } = await encryptPrivateKey(wallet.privateKey, password);

      // Store the encrypted key and salt
      localStorage.setItem('walletBackup', encryptedData);
      localStorage.setItem('walletBackupSalt', salt);
      const serializedPublicKey = serializePublicKey(wallet.publicKey);
      localStorage.setItem('walletPublicKey', serializedPublicKey);
      console.log("Saved public key to localStorage:", serializedPublicKey);

      // Update backup status
      setWallet(prevWallet => ({
        ...prevWallet,
        isBackedUp: true
      }));

      console.log('Wallet backup completed successfully');
      return true;
    } catch (error) {
      console.error('Failed to backup wallet:', error);
      return false;
    }
  };

  // Import existing private key from hex string
  const importPrivateKey = (privateKeyHex) => {
    try {
      // Remove 0x prefix if present
      if (privateKeyHex.startsWith('0x')) {
        privateKeyHex = privateKeyHex.substring(2);
      }

      // Validate hex string format
      if (!/^[0-9a-fA-F]+$/.test(privateKeyHex)) {
        console.error('Invalid hex format for private key');
        return null;
      }

      // Ensure the key is the right length (32 bytes = 64 hex characters)
      if (privateKeyHex.length !== 64) {
        console.error(`Invalid private key length: ${privateKeyHex.length} hex chars, expected 64`);

        // If the key is too long, truncate
        if (privateKeyHex.length > 64) {
          privateKeyHex = privateKeyHex.substring(0, 64);
          console.warn('Private key was too long and has been truncated');
        }

        // If the key is too short, pad with zeros
        if (privateKeyHex.length < 64) {
          privateKeyHex = privateKeyHex.padStart(64, '0');
          console.warn('Private key was too short and has been padded with zeros');
        }
      }

      // Convert hex to Uint8Array
      const privateKey = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        privateKey[i] = parseInt(privateKeyHex.substring(i * 2, i * 2 + 2), 16);
      }

      // Derive the public key
      const publicKey = derivePublicKey(privateKey);
      console.log('Imported private key and derived public key:', publicKey);

      // Update wallet state
      setWallet({
        publicKey,
        privateKey,
        isGenerated: true,
        isBackedUp: false, // Imported keys are not considered backed up
        secretScalar: deriveSecretScalar(privateKey)
      });

      // Store only the public key in localStorage
      try {
        const serializedPublicKey = serializePublicKey(publicKey);
        localStorage.setItem('walletPublicKey', serializedPublicKey);
        // Remove any previous backup as it won't work with this key
        localStorage.removeItem('walletBackup');
        localStorage.removeItem('walletBackupSalt');
      } catch (error) {
        console.error('Failed to store public key in localStorage:', error);
      }

      return { privateKey, publicKey };
    } catch (error) {
      console.error('Error importing private key:', error);
      return null;
    }
  };

  // Restore the private key from backup
  const restoreWallet = async (password: string): Promise<boolean> => {
    const encryptedData = localStorage.getItem('walletBackup');
    console.log("wallet backup", encryptedData)
    const salt = localStorage.getItem('walletBackupSalt');
    console.log("salt", salt)
    const storedPublicKey = localStorage.getItem('walletPublicKey');
    console.log("public key", storedPublicKey)

    if (!encryptedData || !salt || !storedPublicKey) {
      console.error('Cannot restore wallet: No backup found');
      return false;
    }

    try {
      // Decrypt the private key
      const privateKey = await decryptPrivateKey(encryptedData, salt, password);

      // Verify the private key by deriving the public key
      const derivedPublicKey = derivePublicKey(privateKey);
      const storedKey = deserializePublicKey(storedPublicKey);

      // Compare keys (simplified check - implement proper comparison for BigInt arrays)
      const keysMatch = derivedPublicKey[0].toString() === storedKey[0].toString() &&
        derivedPublicKey[1].toString() === storedKey[1].toString();

      if (!keysMatch) {
        console.error('Key verification failed: Derived public key does not match stored key');
        return false;
      }

      // Update wallet with restored private key
      setWallet(prevWallet => ({
        ...prevWallet,
        privateKey,
        isGenerated: true,
        isBackedUp: true,
        secretScalar: deriveSecretScalar(privateKey)
      }));

      console.log('Wallet restored successfully');
      return true;
    } catch (error) {
      console.error('Failed to restore wallet:', error);
      return false;
    }
  };

  // Check if backup exists
  const hasBackup = () => {
    return wallet.isBackedUp ||
      (localStorage.getItem('walletBackup') !== null &&
        localStorage.getItem('walletBackupSalt') !== null);
  };

  // Generate encryption key if we have both keys
  const createEncryptionKey = () => {
    if (!wallet.privateKey || !wallet.publicKey) {
      return null;
    }

    return generateEncryptionKey([wallet.privateKey, wallet.publicKey]);
  };

  // Generate shared key with another public key
  const createEcdhSharedKey = (pubKey: PublicKey) => {
    if (!wallet.privateKey) {
      return null;
    }

    return genEcdhSharedKey(wallet.privateKey, pubKey);
  };

  // Check if keys have been generated
  const hasGeneratedKeys = () => {
    return wallet.isGenerated;
  };

  // Reset wallet (remove keys)
  const resetWallet = () => {
    setWallet({
      publicKey: null,
      privateKey: null,
      isGenerated: false,
      isBackedUp: false,
      secretScalar: null,
    });

    localStorage.removeItem('walletPublicKey');
    localStorage.removeItem('walletBackupSalt');
    localStorage.removeItem('walletBackup');

    // Don't remove backup by default - user might want to restore it later
    // To completely remove backup, call localStorage.removeItem('walletBackup') and 
    // localStorage.removeItem('walletBackupSalt')
  };

  // Debug log wallet state changes
  useEffect(() => {
    console.log("Wallet state updated:", {
      hasPublicKey: !!wallet.publicKey,
      hasPrivateKey: !!wallet.privateKey,
      isGenerated: wallet.isGenerated,
      isBackedUp: wallet.isBackedUp,
      secretScalar: wallet.secretScalar
    });
  }, [wallet]);

  // Context value
  const contextValue = {
    publicKey: wallet.publicKey,
    privateKey: wallet.privateKey,
    isGenerated: wallet.isGenerated,
    isBackedUp: wallet.isBackedUp,
    secretScalar: wallet.secretScalar,
    generateKeys,
    hasGeneratedKeys,
    resetWallet,
    importPrivateKey,
    generateEncryptionKey: createEncryptionKey,
    genEcdhSharedKey: createEcdhSharedKey,
    backupWallet,
    restoreWallet,
    hasBackup,
    poseidonEncryption: createPoseidonEncryption
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