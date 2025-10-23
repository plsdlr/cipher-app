import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from 'wagmi'
import { EncryptedNFTABI, EncryptedNFT_CONTRACT_ADDRESS } from '../contractABI/EncryptedERC721/contractAbi';
import { useWallet } from '../cipherWallet/cipherWallet.tsx';
import { useState, useEffect } from 'react'


function EthWallet() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()

  // State for UI feedback
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  // Format contract address
  const contractAddress = EncryptedNFT_CONTRACT_ADDRESS[11155111]
  const formattedAddress = contractAddress as `0x${string}`


  // Reset status when address changes
  useEffect(() => {
    setRegistrationStatus('idle')
    setStatusMessage('')
  }, [account.address])

  return (
    <fieldset className="terminal-fieldset">
      <legend>ETH WALLET</legend>
      <>
        <div><strong>Status:</strong> {account.status}</div>
        {account.address && <div><strong>Address:</strong> {account.address}</div>}
        {account.chainId && <div><strong>Chain ID:</strong> {account.chainId}</div>}
        {account.status === 'connected' && (
          <button
            type="button"
            onClick={() => disconnect()}
            className="disconnect-button"
          >
            Disconnect
          </button>
        )}
      </>

      {account.status !== 'connected' && (
        <>
          <p>connect wallet:</p>
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
        </>
      )}

    </fieldset>
  )
}

export default EthWallet