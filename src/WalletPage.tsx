// WalletPage.tsx - Enhanced with comprehensive console outputs
import React, { useState, useEffect } from 'react';
import { useWallet } from './cipherWallet/cipherWallet';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from './contractABI/contractAbi';
import EthWallet from './ETHWalletConnector/EthConnector';
import { ConsoleProvider, ConsoleDisplay, useConsole } from './console/ConsoleContext.tsx';

type WalletMode = 'create' | 'import';

const WalletPage = () => {
  const {
    walletState,
    publicKey,
    privateKey,
    createWallet,
    importWallet,
    restoreWallet,
    resetWallet
  } = useWallet();

  const { addMessage } = useConsole();

  // Form states
  const [walletMode, setWalletMode] = useState<WalletMode>('create');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(false);

  const [hasRegisteredKey, setHasRegisteredKey] = useState(false);
  const [isETHConnected, setIsETHConnected] = useState(false);

  // Track previous states to prevent duplicate messages
  const [previousStates, setPreviousStates] = useState({
    walletState: '',
    accountStatus: '',
    hasRegisteredKey: false
  });

  const account = useAccount();
  const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111];
  const formattedAddress = contractAddress as `0x${string}`;

  // Check if the user's address is registered
  const { data: addressRegistered, isLoading: isLoadingContract, error: contractError, refetch } = useReadContract({
    abi: EncryptedNFTABI,
    address: formattedAddress,
    functionName: 'userPublicKeys',
    args: [account.address, 0],
    query: {
      enabled: !!account.address
    }
  });

  // Separate useEffect for account status changes
  useEffect(() => {
    if (account.status !== previousStates.accountStatus) {
      if (account.status === 'connected' && previousStates.accountStatus !== 'connected') {
        setIsETHConnected(true);
        addMessage("Connected to Browser Wallet", "success");
      } else if (account.status === 'disconnected' && previousStates.accountStatus !== 'disconnected') {
        setIsETHConnected(false);
        addMessage("Disconnected from Browser Wallet", "info");
      }

      setPreviousStates(prev => ({ ...prev, accountStatus: account.status }));
    }
  }, [account.status, previousStates.accountStatus]);

  // Separate useEffect for wallet state changes
  useEffect(() => {
    if (walletState !== previousStates.walletState && walletState) {
      if (walletState === 'NEEDS_RESTORE') {
        addMessage("Found CIPHER Wallet in Browser Storage - PLEASE UNLOCK", "info");
      } else if (walletState === 'EMPTY') {
        addMessage("Found no CIPHER Wallet in Browser Storage - Create one", "info");
      } else if (walletState === 'ACTIVE') {
        addMessage("CIPHER Wallet is now ACTIVE and ready to use", "success");
      }

      setPreviousStates(prev => ({ ...prev, walletState }));
    }
  }, [walletState, previousStates.walletState]);

  // Separate useEffect for blockchain registration changes
  useEffect(() => {
    const currentHasRegisteredKey = !!addressRegistered;
    setHasRegisteredKey(currentHasRegisteredKey);

    if (currentHasRegisteredKey !== previousStates.hasRegisteredKey && addressRegistered && account.address) {
      addMessage(`Public key found on blockchain for address: ${account.address.slice(0, 6)}...${account.address.slice(-4)}`, "info");
      setPreviousStates(prev => ({ ...prev, hasRegisteredKey: currentHasRegisteredKey }));
    }
  }, [addressRegistered, account.address, previousStates.hasRegisteredKey]);

  // Show message helper with console output
  const showMessage = (msg: string, type: 'success' | 'error' | 'info') => {
    setMessage(msg);
    setMessageType(type);
    addMessage(msg, type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Validate password with console output
  const validatePassword = (pwd: string, confirmPwd: string): boolean => {
    addMessage("Validating password requirements...", "info");

    if (pwd !== confirmPwd) {
      showMessage('Passwords do not match!', 'error');
      addMessage("Password validation failed: passwords do not match", "error");
      return false;
    }
    if (pwd.length < 5) {
      showMessage('Password must be at least 5 characters!', 'error');
      addMessage("Password validation failed: password too short", "error");
      return false;
    }

    addMessage("Password validation successful", "success");
    return true;
  };

  // Handle form submission based on mode with enhanced console output
  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    addMessage(`Starting ${walletMode} wallet process...`, "info");

    if (!validatePassword(password, confirmPassword)) return;

    setIsLoading(true);
    try {
      let success = false;

      if (walletMode === 'create') {
        addMessage("Generating new cryptographic keys...", "info");
        success = await createWallet(password);
        if (success) {
          showMessage('New wallet created and backed up successfully!', 'success');
          addMessage("✓ New wallet created with encrypted backup", "success");
          addMessage("✓ Private key secured in browser storage", "success");
        } else {
          addMessage("✗ Failed to create new wallet", "error");
        }
      } else {
        if (!privateKeyInput.trim()) {
          showMessage('Please enter a private key', 'error');
          addMessage("Import failed: no private key provided", "error");
          setIsLoading(false);
          return;
        }

        addMessage("Importing private key and deriving public key...", "info");
        success = await importWallet(privateKeyInput.trim(), password);
        if (success) {
          showMessage('Wallet imported and backed up successfully!', 'success');
          addMessage("✓ Private key imported successfully", "success");
          addMessage("✓ Public key derived and wallet backed up", "success");
        } else {
          addMessage("✗ Failed to import wallet - check private key format", "error");
        }
      }

      if (success) {
        // Clear form
        setPassword('');
        setConfirmPassword('');
        setPrivateKeyInput('');
        addMessage("Form cleared for security", "info");
      } else {
        showMessage(`Failed to ${walletMode} wallet. Please try again.`, 'error');
        addMessage(`${walletMode} wallet operation failed`, "error");
      }
    } catch (error) {
      const errorMsg = `Error: ${error.message}`;
      showMessage(errorMsg, 'error');
      addMessage(`Critical error during ${walletMode}: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
      addMessage(`${walletMode} wallet process completed`, "info");
    }
  };

  // Handle restore wallet with enhanced console output
  const handleRestoreWallet = async (e: React.FormEvent) => {
    e.preventDefault();

    addMessage("Starting wallet restoration process...", "info");

    if (!restorePassword.trim()) {
      showMessage('Please enter your password', 'error');
      addMessage("Restore failed: no password provided", "error");
      return;
    }

    setIsLoading(true);
    try {
      addMessage("Attempting to decrypt wallet from storage...", "info");
      const success = await restoreWallet(restorePassword);
      if (success) {
        showMessage('Wallet restored successfully!', 'success');
        addMessage("✓ Wallet successfully restored from encrypted backup", "success");
        addMessage("✓ Private key decrypted and loaded into memory", "success");
        setRestorePassword('');
      } else {
        showMessage('Failed to restore wallet. Check your password.', 'error');
        addMessage("✗ Wallet restore failed - incorrect password or corrupted backup", "error");
      }
    } catch (error) {
      const errorMsg = `Error restoring wallet: ${error.message}`;
      showMessage(errorMsg, 'error');
      addMessage(`Critical error during restore: ${error.message}`, "error");
    } finally {
      setIsLoading(false);
      addMessage("Wallet restoration process completed", "info");
    }
  };

  // Handle reset wallet with enhanced console output
  const handleResetWallet = () => {
    addMessage("User initiated wallet reset...", "info");

    if (window.confirm('Are you sure you want to reset your wallet? This will remove all wallet data permanently.')) {
      addMessage("Wallet reset confirmed by user", "info");
      addMessage("Clearing wallet data from memory...", "info");

      resetWallet();

      showMessage('Wallet reset successfully.', 'info');
      addMessage("✓ Wallet data cleared from session storage", "success");
      addMessage("✓ Private key removed from memory", "success");
      addMessage("⚠ Encrypted backup remains in browser storage", "info");
    } else {
      addMessage("Wallet reset cancelled by user", "info");
    }
  };

  // Handle mode change with console output
  const handleModeChange = (mode: WalletMode) => {
    addMessage(`Switching to ${mode} mode`, "info");
    setWalletMode(mode);

    // Clear form when switching modes
    setPassword('');
    setConfirmPassword('');
    setPrivateKeyInput('');
    addMessage("Form fields cleared for mode switch", "info");
  };

  // Format BigInt for display
  const formatBigInt = (value: bigint): string => {
    const str = value.toString();
    return str.length > 10 ? `${str.substring(0, 5)}...${str.substring(str.length - 5)}` : str;
  };

  // Format byte array for display
  const formatByteArray = (array: Uint8Array): string => {
    const hex = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `${hex.substring(0, 8)}...${hex.substring(hex.length - 8)}`;
  };

  // Log wallet state changes
  useEffect(() => {
    if (publicKey) {
      addMessage(`Public key loaded: [${formatBigInt(publicKey[0])}, ${formatBigInt(publicKey[1])}]`, "info");
    }
    if (privateKey) {
      addMessage(`Private key active in session: ${formatByteArray(privateKey)}`, "info");
    }
  }, [publicKey, privateKey]);

  return (
    <div className="wallet-page">
      <div className="upper-section">
        <h1>CIPHER WALLET</h1>
      </div>

      <EthWallet />

      {/* Status Message */}
      {message && (
        <div className={`message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Wallet State Display */}
      <div className="wallet-status">
        <h2>WALLET STATUS</h2>
        <div className="status-item">
          <strong>State:</strong> {walletState}
        </div>
        {publicKey && (
          <div className="status-item">
            <strong>Public Key:</strong> [{formatBigInt(publicKey[0])}, {formatBigInt(publicKey[1])}]
          </div>
        )}
        {privateKey && (
          <div className="status-item private-key">
            <strong>Private Key:</strong> {formatByteArray(privateKey)} (active in session)
          </div>
        )}
      </div>

      {/* EMPTY State - Show wallet creation/import options */}
      {walletState === 'EMPTY' && (
        <div className="action-section">
          <h2>SETUP WALLET</h2>

          {/* Radio buttons for mode selection */}
          <div className="mode-selector">
            <label className={`mode-option ${walletMode === 'create' ? 'active' : ''}`}>
              <input
                type="radio"
                name="walletMode"
                value="create"
                checked={walletMode === 'create'}
                onChange={() => handleModeChange('create')}
              />
              <span>CREATE NEW WALLET</span>
            </label>
            <label className={`mode-option ${walletMode === 'import' ? 'active' : ''}`}>
              <input
                type="radio"
                name="walletMode"
                value="import"
                checked={walletMode === 'import'}
                onChange={() => handleModeChange('import')}
              />
              <span>IMPORT EXISTING</span>
            </label>
          </div>

          {/* Dynamic form based on selected mode */}
          <form onSubmit={handleWalletSubmit} className="wallet-form">
            <p className="form-description">
              {walletMode === 'create'
                ? 'Generate a new wallet with cryptographic keys'
                : 'Import your wallet using a private key'}
            </p>

            {/* Show private key input only for import mode */}
            {walletMode === 'import' && (
              <div className="form-group">
                <label htmlFor="private-key">Private Key:</label>
                <input
                  type="text"
                  id="private-key"
                  placeholder="Enter private key (hex format, with or without 0x prefix)"
                  value={privateKeyInput}
                  onChange={(e) => {
                    setPrivateKeyInput(e.target.value);
                    if (e.target.value.trim()) {
                      addMessage("Private key input detected", "info");
                    }
                  }}
                  className="private-key-input"
                  required
                />
                <div className="input-note">
                  Your private key will be encrypted and backed up with your password.
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={5}
                placeholder="At least 5 characters"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password:</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={5}
                placeholder="Confirm your password"
              />
            </div>

            <button type="submit" className={walletMode === 'import' ? 'import-button' : ''} disabled={isLoading}>
              {isLoading ? 'Processing...' : walletMode === 'create' ? 'Create Wallet' : 'Import Wallet'}
            </button>
          </form>
        </div>
      )}

      {/* NEEDS_RESTORE State - Show restore form */}
      {walletState === 'NEEDS_RESTORE' && (
        <div className="action-section">
          <h2>RESTORE YOUR WALLET</h2>
          <p>Enter your password to unlock your wallet</p>

          <form onSubmit={handleRestoreWallet}>
            <div className="form-group">
              <label htmlFor="restore-password">Password:</label>
              <input
                type="password"
                id="restore-password"
                value={restorePassword}
                onChange={(e) => {
                  setRestorePassword(e.target.value);
                }}
                required
                placeholder="Enter your wallet password"
              />
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Restoring...' : 'Restore Wallet'}
            </button>
          </form>
        </div>
      )}

      {/* ACTIVE State - Show wallet controls */}
      {walletState === 'ACTIVE' && (
        <div className="action-section">
          <h2>WALLET CONTROLS</h2>
          <p>Your wallet is active and ready to use</p>

          <div className="wallet-actions">
            <button className="reset-button" onClick={handleResetWallet}>
              Reset Wallet
            </button>
          </div>

          <div className="wallet-info">
            <p><strong>Security Note:</strong> Your wallet will remain active until you close this browser tab or the session expires.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;