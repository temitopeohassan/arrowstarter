'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { sdk } from '@farcaster/frame-sdk';

interface FarcasterConnectionContextType {
  isInitialized: boolean;
  isInFrame: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

const FarcasterConnectionContext = createContext<FarcasterConnectionContextType>({
  isInitialized: false,
  isInFrame: false,
  connectionStatus: 'disconnected',
});

export function FarcasterConnectionProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInFrame, setIsInFrame] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Initialize Farcaster SDK
        await sdk.actions.ready();
        console.log('FarcasterConnectionContext: SDK initialized');
        
        // Check if we're in a Farcaster frame by checking if we're in an iframe
        const frameStatus = window !== window.parent;
        setIsInFrame(frameStatus);
        console.log('FarcasterConnectionContext: Is in frame:', frameStatus);
        
        if (frameStatus) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('FarcasterConnectionContext: Failed to initialize:', error);
        setConnectionStatus('error');
        setIsInitialized(true);
      }
    };

    // Add a small delay to ensure the SDK is available
    const timeoutId = setTimeout(() => {
      initializeFarcaster();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <FarcasterConnectionContext.Provider
      value={{
        isInitialized,
        isInFrame,
        connectionStatus,
      }}
    >
      {children}
    </FarcasterConnectionContext.Provider>
  );
}

export function useFarcasterConnection() {
  const context = useContext(FarcasterConnectionContext);
  if (!context) {
    throw new Error('useFarcasterConnection must be used within a FarcasterConnectionProvider');
  }
  return context;
} 