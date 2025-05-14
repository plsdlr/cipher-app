import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from 'wagmi'
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/contractAbi';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import { useState, useEffect } from 'react'


function EthWallet() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContractAsync, isPending, isSuccess, isError, error: writeError } = useWriteContract()

  // Get wallet public key from cipherWallet context
  const { publicKey, isGenerated } = useWallet()

  // State for UI feedback
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Format contract address
  const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111]
  const formattedAddress = contractAddress as `0x${string}`

  // Check if the user's address is registered
  const { data: addressRegistered, isLoading: isLoadingContract, error: contractError, refetch } = useReadContract({
    abi: EncryptedNFTABI,
    address: formattedAddress,
    functionName: 'userPublicKeys',
    args: [account.address, 0],
    enabled: !!account.address
  })

  // Handle registration of public key
  const handleRegisterPublicKey = async () => {
    if (!publicKey || !account.address) {
      setStatusMessage('No public key or wallet address available')
      return
    }

    try {
      setRegistrationStatus('pending')
      setStatusMessage('Registering your public key...')

      await writeContractAsync({
        abi: EncryptedNFTABI,
        address: formattedAddress,
        functionName: 'registerPublicKey',
        args: [publicKey[0], publicKey[1]]
      })

      setRegistrationStatus('success')
      setStatusMessage('Public key registered successfully!')

      // Refetch the registration status after successful transaction
      setTimeout(() => {
        refetch()
      }, 2000) // Give blockchain a moment to update
    } catch (err: any) { // Explicitly type the error
      setRegistrationStatus('error')
      setStatusMessage(`Registration failed: ${err.message}`)
      console.error('Error registering public key:', err)
    }
  }

  // Reset status when address changes
  useEffect(() => {
    setRegistrationStatus('idle')
    setStatusMessage('')
  }, [account.address])

  // Effect to handle successful registration and refresh data
  useEffect(() => {
    if (isSuccess) {
      console.log("loggg from wallet")
      console.log(addressRegistered)
      // Refetch the registration status after successful transaction
      setTimeout(() => {
        refetch()
      }, 2000) // Give blockchain a moment to update
    }
  }, [isSuccess, refetch])

  // Check if we need to show the registration button
  const showRegistrationButton = account.status === 'connected' &&
    isGenerated &&
    publicKey &&
    !addressRegistered

  return (
    <div className="eth-wallet-container">
      <div className="account-status">
        <h2>ETH ACCOUNT</h2>

        <div className="account-info">
          <div><strong>Status:</strong> {account.status}</div>
          {account.address && <div><strong>Address:</strong> {account.address}</div>}
          {account.chainId && <div><strong>Chain ID:</strong> {account.chainId}</div>}
        </div>

        {account.status === 'connected' && (
          <button
            type="button"
            onClick={() => disconnect()}
            className="disconnect-button"
          >
            Disconnect
          </button>
        )}
      </div>

      {account.status !== 'connected' && (
        <div className="connect-wallet">
          <h2>CONNECT</h2>
          <div className="connector-buttons">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                type="button"
                className="connect-button"
              >
                {connector.name}
              </button>
            ))}
          </div>
          {status !== 'idle' && <div className="connect-status">{status}</div>}
          {error && <div className="connect-error">{error.message}</div>}
        </div>
      )}

      {/* Registration section */}
      {showRegistrationButton && (
        <div className="registration-section">
          <h2>REGISTER YOUR PUBLIC KEY</h2>
          <p>You need to register your public key on the blockchain to use all features.</p>

          <button
            onClick={handleRegisterPublicKey}
            disabled={registrationStatus === 'pending' || !isGenerated || !publicKey}
            className="register-button"
          >
            {registrationStatus === 'pending' ? 'Registering...' : 'Register Public Key'}
          </button>

          {statusMessage && (
            <div className={`status-message ${registrationStatus}`}>
              {statusMessage}
            </div>
          )}

          {isGenerated && publicKey && (
            <div className="key-info">
              <p>Public Key to register:</p>
              <code>[{String(publicKey[0]).substring(0, 10)}...{String(publicKey[1]).substring(0, 10)}...]</code>
            </div>
          )}

          {!isGenerated && (
            <div className="key-warning">
              You need to generate a wallet key first before registering.
            </div>
          )}
        </div>
      )}

      {/* Confirmation when already registered */}
      {account.status === 'connected' && addressRegistered && (
        <div className="registration-confirmed">
          <h3>✓ PUBLIC KEY REGISTERED</h3>
          <p>Your public key is already registered on the blockchain.</p>
        </div>
      )}
    </div>
  )
}

export default EthWallet