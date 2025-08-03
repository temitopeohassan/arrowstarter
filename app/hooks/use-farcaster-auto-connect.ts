import { useEffect, useState, useCallback } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { sdk } from '@farcaster/frame-sdk';
import { useFarcasterConnection } from '@/context/FarcasterConnectionContext';

export function useFarcasterAutoConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Use the global Farcaster connection context
  const { isInFrame, connectionStatus } = useFarcasterConnection();

  const attemptConnection = useCallback(async () => {
    try {
      console.log('Farcaster auto-connect: Is in frame:', isInFrame);
      console.log('Farcaster auto-connect: Connection status:', connectionStatus);

      if (isInFrame && !isConnected && !isPending && connectionStatus === 'connected') {
        // Find the Farcaster frame connector
        const farcasterConnector = connectors.find(
          (connector) => connector.id === 'farcaster'
        );

        if (farcasterConnector) {
          console.log('Farcaster auto-connect: Attempting to connect with Farcaster connector');
          await connect({ connector: farcasterConnector });
          setConnectionAttempts(prev => prev + 1);
        } else {
          console.warn('Farcaster auto-connect: Farcaster connector not found');
        }
      }
    } catch (error) {
      console.error('Farcaster auto-connect: Failed to connect:', error);
    }
  }, [connect, connectors, isConnected, isPending, isInFrame, connectionStatus]);

  // Initialize and attempt connection when context is ready
  useEffect(() => {
    const initializeAndConnect = async () => {
      try {
        console.log('Farcaster auto-connect: Initializing with context status:', connectionStatus);
        
        // Attempt initial connection if we're in frame and context is ready
        if (isInFrame && connectionStatus === 'connected') {
          await attemptConnection();
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Farcaster auto-connect: Failed to initialize:', error);
        setIsInitialized(true);
      }
    };

    if (connectionStatus !== 'connecting') {
      initializeAndConnect();
    }
  }, [attemptConnection, isInFrame, connectionStatus]);

  // Retry connection if not connected after initialization
  useEffect(() => {
    if (isInitialized && !isConnected && isInFrame && connectionStatus === 'connected' && connectionAttempts < 3) {
      const retryTimeout = setTimeout(() => {
        console.log('Farcaster auto-connect: Retrying connection, attempt:', connectionAttempts + 1);
        attemptConnection();
      }, 1000 * (connectionAttempts + 1)); // Exponential backoff

      return () => clearTimeout(retryTimeout);
    }
  }, [isInitialized, isConnected, connectionAttempts, attemptConnection, isInFrame, connectionStatus]);

  // Monitor for connection status changes
  useEffect(() => {
    if (isConnected) {
      console.log('Farcaster auto-connect: Successfully connected to wallet');
    }
  }, [isConnected]);

  return {
    isConnected,
    address,
    isInitialized,
    isInFrame,
    isPending,
    connectionAttempts,
    connectionStatus,
  };
} 