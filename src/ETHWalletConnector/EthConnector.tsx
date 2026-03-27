import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { mainnet } from 'wagmi/chains'

function EthWallet() {
  const account = useAccount()
  const { connectors, connect, status, error } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const isWrongNetwork = account.status === 'connected' && account.chainId !== mainnet.id


  return (
    <fieldset className="terminal-fieldset">
      <legend>ETH WALLET</legend>
      <>
        <div className="wallet-info-table">
          <div className="wallet-info-row">
            <div className="wallet-info-label">Status:</div>
            <div className="wallet-info-value">{account.status}</div>
          </div>
          {account.address && (
            <div className="wallet-info-row">
              <div className="wallet-info-label">Address:</div>
              <div className="wallet-info-value">{account.address.slice(0, 9)}...</div>
            </div>
          )}
          {account.chainId && (
            <div className="wallet-info-row">
              <div className="wallet-info-label">Chain ID:</div>
              <div className="wallet-info-value">{account.chainId}</div>
            </div>
          )}
        </div>
        {isWrongNetwork && (
          <div className="wallet-warning">
            <strong className="wallet-warning-title">⚠ Wrong Network</strong>
            <p className="wallet-warning-message">Please switch to Ethereum Mainnet.</p>
            <button
              type="button"
              onClick={() => switchChain({ chainId: mainnet.id })}
              disabled={isSwitching}
              className="connect-button"
            >
              {isSwitching ? 'Switching...' : 'Switch to Mainnet'}
            </button>
          </div>
        )}
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