// WalletPage.jsx
import React, { useState, useEffect } from 'react';
import { useWallet } from './cipherWallet/cipherWallet';
import EthWallet from './ETHWalletConnector/EthConnector';
import { useAccount, useReadContract, useWriteContract } from 'wagmi'
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from './contractABI/contractAbi';

const WalletPage = () => {
  const {
    publicKey,
    privateKey,
    secretScalar,
    isGenerated,
    isBackedUp,
    generateKeys,
    importPrivateKey,
    backupWallet,
    restoreWallet,
    hasBackup,
    resetWallet
  } = useWallet();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [showBackupForm, setShowBackupForm] = useState(false);

  // is the user connceted to eth via wallet
  const [isETHConnected, setIsETHConnected] = useState(false);
  // has the user currently keys generates
  const [hasKeysNow, setHasKeysNow] = useState(false);
  // has the user an encrypted backup in browser storage
  const [hasBackupNow, setHasBackupNow] = useState(false);
  // has the user registered his public keys onchain
  const [hasRegisteredKey, setHasRegisteredKey] = useState(false);

  const account = useAccount()
  const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111]
  const formattedAddress = contractAddress as `0x${string}`


  // Check if the user's address is registered
  const { data: addressRegistered, isLoading: isLoadingContract, error: contractError, refetch } = useReadContract({
    abi: EncryptedNFTABI,
    address: formattedAddress,
    functionName: 'userPublicKeys',
    args: [account.address, 0],
    query: {
      enabled: !!account.address
    }
  })


  // Check for wallet backup on load
  useEffect(() => {

    if (hasBackup()) {
      setHasBackupNow(true);
    }
    if (isGenerated) {
      setHasKeysNow(true);
    }
    if (account.status === 'connected') {
      setIsETHConnected(true);
    }
    setHasRegisteredKey(!!addressRegistered);


  }, [addressRegistered, isGenerated, hasBackupNow]);


  // Handle direct private key import
  const handleImportPrivateKey = (e) => {
    e.preventDefault();

    if (!privateKeyInput.trim()) {
      setMessage('Please enter a private key');
      setMessageType('error');
      return;
    }

    try {
      const result = importPrivateKey(privateKeyInput);

      if (result) {
        setMessage('Private key imported successfully and public key derived!');
        setMessageType('success');
        setPrivateKeyInput(''); // Clear the input field for security
      } else {
        setMessage('Failed to import private key. Please check the format and try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Error importing private key: ${error.message}`);
      setMessageType('error');
    }
  };

  // Handle wallet backup
  const handleBackupWallet = async (e) => {
    e.preventDefault();

    // Validation
    if (password !== confirmPassword) {
      setMessage('Passwords do not match!');
      setMessageType('error');
      return;
    }

    if (password.length < 3) {
      setMessage('Password must be at least 3 characters!');
      setMessageType('error');
      return;
    }

    try {
      const success = await backupWallet(password);
      if (success) {
        setMessage('Wallet backed up successfully! Keep your password safe.');
        setMessageType('success');
        setPassword('');
        setConfirmPassword('');
        setShowBackupForm(false);
        setHasBackupNow(true);
      } else {
        setMessage('Failed to backup wallet.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Backup error: ${error}`);
      setMessageType('error');
    }
  };

  // Handle wallet restore
  const handleRestoreWallet = async (e) => {
    e.preventDefault();

    try {
      const success = await restoreWallet(restorePassword);
      if (success) {
        setMessage('Wallet restored successfully!');
        setMessageType('success');
        setRestorePassword('');
      } else {
        setMessage('Failed to restore wallet. Check your password and try again.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(`Restore error: ${error}`);
      setMessageType('error');
    }
  };

  const ImportKey = (
    <div className="action-section">
      <h2>IMPORT EXISTING PRIVATE KEY   </h2>
      <p>Enter your private key in hexadecimal format (with or without 0x prefix):</p>

      <p>
        <form onSubmit={handleImportPrivateKey}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Enter private key (hex format)"
              value={privateKeyInput}
              onChange={(e) => setPrivateKeyInput(e.target.value)}
              className="private-key-input"
            />
            <p>
              Note: This is sensitive information. Be careful when handling private keys.
            </p>
          </div>

          <button type="submit" className="import-button">
            Import Private Key
          </button>
        </form>
      </p>
    </div>
  )

  const CreateBackup = (<div className="action-section">
    <h2>BACKUP YOUR WALLET</h2>
    <p>Create a password to encrypt and backup your private key:</p>

    <form onSubmit={handleBackupWallet}>
      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={4}
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password:</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={4}
        />
      </div>

      <button type="submit">Backup Wallet</button>
    </form>
  </div>
  )


  return (
    <div className="wallet-page">
      <EthWallet></EthWallet>
      KEYS Generated: {String(hasKeysNow)}
      <br></br>
      Backup Generated: {String(hasBackupNow)}
      <br></br>
      Registered Public Key: {String(hasRegisteredKey)}
      <br></br>
      {!hasKeysNow && !hasBackupNow && hasRegisteredKey && ImportKey}
      {hasKeysNow && !hasBackupNow && hasRegisteredKey && CreateBackup}
    </div>
  );
};

export default WalletPage;