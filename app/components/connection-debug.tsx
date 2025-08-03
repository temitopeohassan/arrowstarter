'use client';

import { useFarcasterAutoConnect } from '@/hooks/use-farcaster-auto-connect';
import { useFarcasterConnection } from '@/context/FarcasterConnectionContext';

export function ConnectionDebug() {
  try {
    const { isConnected, address, isInitialized, isInFrame, connectionStatus } = useFarcasterAutoConnect();
    const { connectionStatus: globalStatus } = useFarcasterConnection();

    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return (
      <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
        <h3 className="font-bold mb-2">Farcaster Connection Debug</h3>
        <div className="space-y-1">
          <div>In Frame: {isInFrame ? 'Yes' : 'No'}</div>
          <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
          <div>Initialized: {isInitialized ? 'Yes' : 'No'}</div>
          <div>Local Status: {connectionStatus}</div>
          <div>Global Status: {globalStatus}</div>
          {address && <div>Address: {address.slice(0, 6)}...{address.slice(-4)}</div>}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ConnectionDebug error:', error);
    return null;
  }
} 