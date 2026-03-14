import type { AlphaSnapshot, ApprovalActionResult, CommandActionResult, TerminalCommand, TerminalSession, TimelineEvent } from '@agentic-scifi/shared-schema';
import { buildMockAlphaSnapshot } from '@agentic-scifi/test-utils';

export interface RuntimeBridgeClient {
  getAlphaSnapshot(): Promise<AlphaSnapshot>;
  subscribeToEvents(callback: (event: TimelineEvent) => void): () => void;
  approveApproval(approvalId: string): Promise<ApprovalActionResult>;
  rejectApproval(approvalId: string): Promise<ApprovalActionResult>;
  runSuggestedCommand(command: string): Promise<CommandActionResult>;
}

declare global {
  var __ASCC_RUNTIME_BRIDGE__: RuntimeBridgeClient | undefined;
}

export function createLocalRuntimeBridgeClient(): RuntimeBridgeClient {
  return globalThis.__ASCC_RUNTIME_BRIDGE__ ?? createBrowserMockRuntimeBridgeClient();
}

function createBrowserMockRuntimeBridgeClient(): RuntimeBridgeClient {
  let snapshot = buildMockAlphaSnapshot('browser-safe mock');
  const listeners = new Set<(event: TimelineEvent) => void>();

  function emit(event: TimelineEvent) {
    listeners.forEach((listener) => listener(event));
  }

  function appendEvent(event: TimelineEvent) {
    snapshot = {
      ...snapshot,
      events: [event, ...snapshot.events]
    };
    emit(event);
  }

  return {
    async getAlphaSnapshot() {
      return snapshot;
    },
    subscribeToEvents(callback) {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    async approveApproval(approvalId) {
      if (!approvalId || typeof approvalId !== 'string') {
        throw new Error('approveApproval requires a non-empty approvalId string');
      }
      const approved = snapshot.approvals.find((approval) => approval.id === approvalId);
      snapshot = {
        ...snapshot,
        approvals: snapshot.approvals.filter((approval) => approval.id !== approvalId)
      };
      const event = createEvent('Approval accepted', approved ? `${approved.title} moved forward.` : 'Unknown approval accepted.', 'green', 'approval');
      appendEvent(event);
      return { snapshot, event };
    },
    async rejectApproval(approvalId) {
      if (!approvalId || typeof approvalId !== 'string') {
        throw new Error('rejectApproval requires a non-empty approvalId string');
      }
      const rejected = snapshot.approvals.find((approval) => approval.id === approvalId);
      snapshot = {
        ...snapshot,
        approvals: snapshot.approvals.filter((approval) => approval.id !== approvalId)
      };
      const event = createEvent('Approval rejected', rejected ? `${rejected.title} was rejected and returned for revision.` : 'Unknown approval rejected.', 'amber', 'approval');
      appendEvent(event);
      return { snapshot, event };
    },
    async runSuggestedCommand(command) {
      if (!command || typeof command !== 'string') {
        throw new Error('runSuggestedCommand requires a non-empty command string');
      }
      const session = snapshot.terminalSessions?.[0];
      const timestamp = nowIso();
      const commandId = `cmd-${Date.now()}`;

      if (session) {
        const matchedSuggestion = snapshot.commandSuggestions?.find((suggestion) => suggestion.command === command);
        const terminalCommand: TerminalCommand = {
          id: commandId,
          sessionId: session.id,
          command,
          kind: 'suggested',
          status: 'queued',
          risk: matchedSuggestion?.risk ?? 'medium',
          startedAt: timestamp,
          summary: 'Command staged in browser-safe mock bridge.'
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
            'status: queued in browser-safe mock runtime'
          ]
        };

        snapshot = {
          ...snapshot,
          terminalSessions: [updatedSession, ...(snapshot.terminalSessions ?? []).slice(1)],
          terminalCommands: [terminalCommand, ...(snapshot.terminalCommands ?? [])]
        };
      }

      const event = createEvent('Command staged', `Prepared command ${commandId}: ${command}`, 'cyan', 'command');
      appendEvent(event);
      return { snapshot, event };
    }
  };
}

function nowIso() {
  return new Date().toISOString();
}

function createEvent(
  title: string,
  detail: string,
  tone: TimelineEvent['tone'],
  category: TimelineEvent['category']
): TimelineEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    detail,
    tone,
    category,
    timestamp: nowIso()
  };
}

