// app/providers.tsx or app/layout.tsx
'use client';

import { WagmiProvider } from 'wagmi';
import { config } from './wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
