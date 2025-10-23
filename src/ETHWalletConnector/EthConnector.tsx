import { useAccount, useConnect, useDisconnect } from 'wagmi'

function EthWallet() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()


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