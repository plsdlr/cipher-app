import { Buffer } from 'buffer'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { WalletProvider } from './cipherWallet/cipherWallet.tsx';
import MainApp from './mainApp.tsx';
import { config } from './wagmi.ts'
import { ConsoleProvider } from './console/ConsoleContext.tsx';


import './index-test.css'

globalThis.Buffer = Buffer

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConsoleProvider>
          <WalletProvider>
            <MainApp />
          </WalletProvider>
        </ConsoleProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode >,
)
