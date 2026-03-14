import { createContext, useContext } from 'react';
import type { RuntimeBridgeClient } from '@agentic-scifi/client-sdk';

const BridgeContext = createContext<RuntimeBridgeClient | null>(null);

export function BridgeProvider({ client, children }: { client: RuntimeBridgeClient; children: React.ReactNode }) {
  return <BridgeContext value={client}>{children}</BridgeContext>;
}

export function useBridgeClient(): RuntimeBridgeClient {
  const client = useContext(BridgeContext);
  if (!client) {
    throw new Error('useBridgeClient must be used within a BridgeProvider');
  }
  return client;
}
