import { useEffect, useRef, useState } from 'react';
import type { AlphaSnapshot } from '@agentic-scifi/shared-schema';
import type { RuntimeBridgeClient } from '@agentic-scifi/client-sdk';

export type BridgeStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface AlphaSnapshotState {
  snapshot: AlphaSnapshot | null;
  setSnapshot: React.Dispatch<React.SetStateAction<AlphaSnapshot | null>>;
  status: BridgeStatus;
  errorMessage: string | null;
  restoredTerminalIds: string[];
  setRestoredTerminalIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useAlphaSnapshot(client: RuntimeBridgeClient): AlphaSnapshotState {
  const [snapshot, setSnapshot] = useState<AlphaSnapshot | null>(null);
  const [status, setStatus] = useState<BridgeStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [restoredTerminalIds, setRestoredTerminalIds] = useState<string[]>([]);
  const initialSnapshotLoadedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const nextSnapshot = await client.getAlphaSnapshot();
        if (!active) return;
        setSnapshot(nextSnapshot);
        if (!initialSnapshotLoadedRef.current) {
          setRestoredTerminalIds((nextSnapshot.terminalSessions ?? []).map((session) => session.id));
          initialSnapshotLoadedRef.current = true;
        }
        setStatus('ready');
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Unknown bridge failure');
      }
    }

    void loadSnapshot();
    return () => {
      active = false;
    };
  }, [client]);

  useEffect(() => {
    if (status !== 'ready') return;
    return client.subscribeToEvents((event) => {
      setSnapshot((current) => {
        if (!current) return current;
        if (current.events.some((existing) => existing.id === event.id)) return current;
        return {
          ...current,
          events: [event, ...current.events]
        };
      });
    });
  }, [client, status]);

  return { snapshot, setSnapshot, status, errorMessage, restoredTerminalIds, setRestoredTerminalIds };
}
