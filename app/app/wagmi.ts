// wagmi.ts
'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { cookieStorage, createStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { farcasterFrameConnector } from '@farcaster/frame-wagmi-connector';

export const config = getDefaultConfig({
  appName: 'Arrow Starter',
  projectId: 'd3057ed5526f6bc31e86aaf9b72c8f4e', // ✅ Required for RainbowKit v1.0+
  chains: [base, baseSepolia],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  connectors: [
    farcasterFrameConnector({
      chains: [base, baseSepolia],
      options: {
        // Enable auto-connection when in Farcaster frame
        autoConnect: true,
      },
    }),
  ],
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
