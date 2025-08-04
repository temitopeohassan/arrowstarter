// wagmi.ts
'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import farcasterFrameConnector from '@farcaster/frame-wagmi-connector';
import { createConfig, http } from 'wagmi';

// Create the config with Farcaster connector
export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    farcasterFrameConnector(),
  ],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
