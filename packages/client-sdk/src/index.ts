import type { AlphaSnapshot, ApprovalActionResult, CommandActionResult, TerminalCommand, TerminalSession, TimelineEvent } from '@agentic-scifi/shared-schema';

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
  let snapshot = buildBrowserSnapshot();
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

function buildBrowserSnapshot(): AlphaSnapshot {
  const timestamp = nowIso();
  const initialSession: TerminalSession = {
    id: 'term-1',
    title: 'alpha-shell',
    cwd: '/root/.openclaw/workspace/agentic-scifi-command-center',
    status: 'idle',
    source: 'mock',
    startedAt: timestamp,
    updatedAt: timestamp,
    lastCommand: 'echo "alpha shell ready"',
    lastCommandId: 'cmd-1',
    commandIds: ['cmd-1'],
    exitCode: 0,
    lines: ['$ pwd', '/root/.openclaw/workspace/agentic-scifi-command-center', '$ echo "alpha shell ready"', 'alpha shell ready']
  };

  const initialCommand: TerminalCommand = {
    id: 'cmd-1',
    sessionId: initialSession.id,
    command: 'echo "alpha shell ready"',
    kind: 'manual',
    status: 'succeeded',
    risk: 'low',
    startedAt: timestamp,
    finishedAt: timestamp,
    exitCode: 0,
    summary: 'Bootstrap shell probe completed in the browser-safe mock runtime.'
  };

  return {
    project: {
      id: 'project-alpha',
      name: 'Aegis Bridge',
      phase: 'alpha bootstrap',
      description: 'Trustworthy local-first command center for developers and operators.',
      nextSteps: [
        'Replace UI-only mocks with bridge-fed state',
        'Add approval detail treatment with rationale and impact',
        'Prepare event timeline for structured persistence'
      ],
      decisions: [
        'Electron for V1 shell',
        'Node runtime bridge for orchestration and PTY work',
        'Tactical Minimal as the default visual system'
      ]
    },
    tasks: [
      { id: 'task-1', projectId: 'project-alpha', goal: 'Bootstrap repo and app structure', status: 'active' },
      { id: 'task-2', projectId: 'project-alpha', goal: 'Wire bridge snapshot into renderer', status: 'active' },
      { id: 'task-3', projectId: 'project-alpha', goal: 'Design approval detail flow', status: 'todo' }
    ],
    runs: [
      { id: 'run-1', taskId: 'task-1', role: 'planner', goal: 'Sequence the next implementation slices', status: 'running', summary: 'Repo scaffold landed; state wiring in progress.' },
      { id: 'run-2', taskId: 'task-2', role: 'runtime', goal: 'Expose mock snapshot through bridge contract', status: 'waiting_approval', summary: 'Needs detail-rich approval UI next.' }
    ],
    approvals: [
      {
        id: 'approval-1',
        title: 'Approve week-1 architecture spike scope',
        risk: 'medium',
        preview: 'Enable shell, events and approval skeleton first.',
        rationale: 'This proves the product core before terminal polish expands scope.',
        impact: 'Affects renderer/bridge boundaries and first runtime contracts.',
        commandPreview: 'npm install && npm run build:ui',
        diffPreview: [
          '+ apps/ui/src/App.tsx loads bridge-fed snapshot',
          '+ packages/runtime-bridge exposes richer alpha snapshot',
          '+ approval detail now includes rationale and impact'
        ],
        rollbackHint: 'Revert the workspace wiring commit and restore UI-only mock data if the bridge path misbehaves.'
      },
      {
        id: 'approval-2',
        title: 'Approve alpha UI priorities',
        risk: 'low',
        preview: 'Project Workspace first; terminal surface lands after state and approvals.',
        rationale: 'The project workspace is the primary differentiation surface.',
        impact: 'Keeps the first vertical slice disciplined and reviewable.',
        commandPreview: 'focus project-workspace && defer terminal-depth',
        diffPreview: [
          '+ approval center promoted in context stack',
          '+ mission timeline kept visible beside active runs',
          '- no cinematic-only work before functional depth'
        ],
        rollbackHint: 'If this proves too narrow, widen the slice by adding the terminal surface immediately after approval depth.'
      }
    ],
    artifacts: [
      { id: 'artifact-1', type: 'report', title: 'Alpha status baseline' },
      { id: 'artifact-2', type: 'decision', title: 'V1 shell choice: Electron' },
      { id: 'artifact-3', type: 'report', title: 'Implementation backlog' }
    ],
    events: [
      { id: 'event-1', title: 'Runtime bridge seeded', detail: 'Alpha snapshot now lives in the bridge package rather than only in the UI.', tone: 'green', category: 'system', timestamp },
      { id: 'event-2', title: 'State wiring queued', detail: 'Renderer should fetch snapshot asynchronously and render loading/error states.', tone: 'cyan', category: 'agent', timestamp },
      { id: 'event-3', title: 'Approval detail required', detail: 'Need rationale, impact scope and deeper review treatment.', tone: 'amber', category: 'approval', timestamp },
      { id: 'event-4', title: 'Artifact capture prepared', detail: 'Implementation backlog and shell choice are now represented as first-class artifacts.', tone: 'green', category: 'artifact', timestamp }
    ],
    commandSuggestions: [
      { intent: 'Build UI bundle', command: 'npm run build:ui', explanation: 'Produces a production build for the current UI workspace.', risk: 'low' },
      { intent: 'Install workspace deps', command: 'npm install', explanation: 'Installs and links workspace dependencies for all packages.', risk: 'medium' },
      { intent: 'Inspect repo structure', command: 'find . -maxdepth 3 -type f | sort', explanation: 'Lists the current scaffold contents so we can verify the alpha shape.', risk: 'low' }
    ],
    terminalSessions: [initialSession],
    terminalCommands: [initialCommand]
  };
}
