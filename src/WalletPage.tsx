// WalletPage.jsx
import React, { useState, useEffect } from 'react';
import { useWallet } from './cipherWallet';

const WalletPage = () => {
  const {
    publicKey,
    privateKey,
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

  // Check for wallet backup on load
  useEffect(() => {
    if (hasBackup() && !privateKey) {
      setMessage('Wallet backup found! Enter your password to restore.');
      setMessageType('info');
    }
  }, [hasBackup, privateKey]);

  // Handle key generation
  const handleGenerateKeys = () => {
    try {
      generateKeys();
      setMessage('New wallet keys generated successfully!');
      setMessageType('success');
      setShowBackupForm(true);
    } catch (error) {
      setMessage(`Failed to generate keys: ${error}`);
      setMessageType('error');
    }
  };

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

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters!');
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

  // Handle wallet reset
  const handleResetWallet = () => {
    if (window.confirm('Are you sure you want to reset your wallet? This will remove the active keys from memory.')) {
      resetWallet();
      setMessage('Wallet reset. Backup remains in storage if you need to restore.');
      setMessageType('info');
    }
  };

  // Format a BigInt for display
  const formatBigInt = (value) => {
    if (!value) return 'None';
    const str = value.toString();
    return str.length > 10 ? `${str.substring(0, 5)}...${str.substring(str.length - 5)}` : str;
  };

  // Format a byte array for display
  const formatByteArray = (array) => {
    if (!array) return 'None';
    const hex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return hex;
  };

  return (
    <div className="wallet-page">
      <div className="upper-section">
        <h1>CIPHER WALLET</h1>

      </div>

      {/* Wallet Status */}
      <div className="wallet-status">
        <h2>WALLET STATUS</h2>

        <div className="status-item">
          <strong>Keys Generated:</strong> {isGenerated ? 'Yes' : 'No'}
        </div>
        <div className="status-item">
          <strong>Backup Created:</strong> {isBackedUp ? 'Yes' : 'No'}
        </div>
        {publicKey && (
          <div className="status-item">
            <strong>Public Key:</strong> [{formatBigInt(publicKey[0])}, {formatBigInt(publicKey[1])}]
          </div>
        )}
        {privateKey && (
          <div className="status-item private-key">
            <strong>Private Key:</strong> {formatByteArray(privateKey)} (only in memory)
          </div>
        )}
      </div>


      {/* Status Message */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Generate Keys Section */}
      {!isGenerated && (
        <div className="action-section">
          <h2>CREATE NEW WALLET</h2>
          <button onClick={handleGenerateKeys}>Generate Keys</button>
        </div>
      )}

      {/* Import Private Key Section */}
      {!isGenerated && (
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
      )}

      {/* Backup Form */}
      {isGenerated && privateKey && showBackupForm && (
        <div className="action-section">
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
                minLength={8}
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
                minLength={8}
              />
            </div>

            <button type="submit">Backup Wallet</button>
          </form>
        </div>
      )}

      {/* Show backup option if hidden */}
      {isGenerated && privateKey && !showBackupForm && !isBackedUp && (
        <div className="action-section">
          <button onClick={() => setShowBackupForm(true)}>Create Backup</button>
        </div>
      )}

      {/* Restore Form */}
      {hasBackup() && !privateKey && (
        <div className="action-section">
          <h2>Restore Your Wallet</h2>
          <p>Enter your password to decrypt and restore your private key:</p>

          <p>
            <form onSubmit={handleRestoreWallet}>
              <div className="form-group">
                <label htmlFor="restorePassword">Password:</label>
                <input
                  type="password"
                  id="restorePassword"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  required
                />
              </div>
              <p>
                <button type="submit">Restore Wallet</button>
              </p>
            </form>

          </p>
        </div>
      )}

      {/* Reset Wallet */}
      {isGenerated && (
        <div className="action-section">
          <button className="reset-button" onClick={handleResetWallet}>
            Reset Wallet
          </button>
        </div>
      )}

      {/* CSS Styles */}
    </div>
  );
};

export default WalletPage;