import type {
  AlphaSnapshot,
  ApprovalActionResult,
  CommandActionResult,
  TerminalCommand,
  TerminalSession,
  TimelineEvent
} from '@agentic-scifi/shared-schema';
import { buildMockAlphaSnapshot } from '@agentic-scifi/shared-schema';
import { InMemorySnapshotStorage, type SnapshotStorage } from './storage';

export {
  InMemorySnapshotStorage,
  LocalFileSnapshotStorage,
  JsonFileSnapshotStorage,
  type SnapshotStorage
} from './storage';

function nowIso() {
  return new Date().toISOString();
}

function createEvent(event: Omit<TimelineEvent, 'id' | 'timestamp'>): TimelineEvent {
  return {
    ...event,
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: nowIso()
  };
}

export function createRuntimeBridge(storage: SnapshotStorage = new InMemorySnapshotStorage()) {
  let snapshot = buildMockAlphaSnapshot('mock alpha runtime');
  const listeners = new Set<(event: TimelineEvent) => void>();
  const initialized = storage.load().then((stored) => {
    if (stored) snapshot = stored;
  });

  function emit(event: TimelineEvent) {
    listeners.forEach((listener) => listener(event));
  }

  async function persistSnapshot() {
    await storage.save(snapshot);
  }

  async function appendEvent(event: TimelineEvent) {
    snapshot = {
      ...snapshot,
      events: [event, ...snapshot.events]
    };
    await persistSnapshot();
    emit(event);
  }

  return {
    async getAlphaSnapshot(): Promise<AlphaSnapshot> {
      await initialized;
      return snapshot;
    },
    subscribeToEvents(callback: (event: TimelineEvent) => void) {
      listeners.add(callback);

      const timer = setTimeout(() => {
        void initialized.then(() => {
          const event = createEvent({
            title: 'Live alpha pulse received',
            detail: 'Runtime bridge emitted a synthetic heartbeat event to prove the event subscription path.',
            tone: 'cyan',
            category: 'system'
          });
          return appendEvent(event);
        });
      }, 1800);

      return () => {
        clearTimeout(timer);
        listeners.delete(callback);
      };
    },
    async approveApproval(approvalId: string): Promise<ApprovalActionResult> {
      if (!approvalId || typeof approvalId !== 'string') {
        throw new Error('approveApproval requires a non-empty approvalId string');
      }
      await initialized;
      const approved = snapshot.approvals.find((approval) => approval.id === approvalId);
      snapshot = {
        ...snapshot,
        approvals: snapshot.approvals.filter((approval) => approval.id !== approvalId)
      };
      const event = createEvent({
        title: 'Approval accepted',
        detail: approved ? `${approved.title} moved forward.` : 'Unknown approval accepted.',
        tone: 'green',
        category: 'approval'
      });
      await appendEvent(event);
      return { snapshot, event };
    },
    async rejectApproval(approvalId: string): Promise<ApprovalActionResult> {
      if (!approvalId || typeof approvalId !== 'string') {
        throw new Error('rejectApproval requires a non-empty approvalId string');
      }
      await initialized;
      const rejected = snapshot.approvals.find((approval) => approval.id === approvalId);
      snapshot = {
        ...snapshot,
        approvals: snapshot.approvals.filter((approval) => approval.id !== approvalId)
      };
      const event = createEvent({
        title: 'Approval rejected',
        detail: rejected ? `${rejected.title} was rejected and returned for revision.` : 'Unknown approval rejected.',
        tone: 'amber',
        category: 'approval'
      });
      await appendEvent(event);
      return { snapshot, event };
    },
    async runSuggestedCommand(command: string): Promise<CommandActionResult> {
      if (!command || typeof command !== 'string') {
        throw new Error('runSuggestedCommand requires a non-empty command string');
      }
      await initialized;
      const session = snapshot.terminalSessions?.[0];
      const timestamp = nowIso();
      const commandId = `cmd-${Date.now()}`;

      if (!session) {
        const event = createEvent({
          title: 'Command staging failed',
          detail: `No terminal session exists for command: ${command}`,
          tone: 'amber',
          category: 'command'
        });
        await appendEvent(event);
        return { snapshot, event };
      }

      const matchedSuggestion = snapshot.commandSuggestions?.find((suggestion) => suggestion.command === command);
      const terminalCommand: TerminalCommand = {
        id: commandId,
        sessionId: session.id,
        command,
        kind: 'suggested',
        status: 'queued',
        risk: matchedSuggestion?.risk ?? 'medium',
        startedAt: timestamp,
        summary: 'Command staged in the mock runtime bridge. Ready for SQLite-backed lifecycle tracking next.'
      };

      const updatedSession: TerminalSession = {
        ...session,
        status: 'running',
        updatedAt: timestamp,
        lastCommand: command,
        lastCommandId: commandId,
        commandIds: [...(session.commandIds ?? []), commandId],
        lines: [
          ...session.lines,
          `$ ${command}`,
          `queued command id: ${commandId}`,
          `risk: ${terminalCommand.risk}`,
          'status: queued for mock execution lifecycle',
          'next: persist session + command rows before wiring a real PTY'
        ]
      };

      snapshot = {
        ...snapshot,
        terminalSessions: [updatedSession, ...(snapshot.terminalSessions ?? []).slice(1)],
        terminalCommands: [terminalCommand, ...(snapshot.terminalCommands ?? [])]
      };

      const event = createEvent({
        title: 'Command staged',
        detail: `Prepared command ${commandId} for session ${session.title}: ${command}`,
        tone: 'cyan',
        category: 'command'
      });
      await appendEvent(event);
      return { snapshot, event };
    }
  };
}
