import type { AlphaSnapshot, TerminalCommand, TerminalSession } from './index';

export function buildMockAlphaSnapshot(label: string = 'mock'): AlphaSnapshot {
  const timestamp = new Date().toISOString();

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
    lines: [
      '$ pwd',
      '/root/.openclaw/workspace/agentic-scifi-command-center',
      '$ echo "alpha shell ready"',
      'alpha shell ready'
    ]
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
    summary: `Bootstrap shell probe completed in the ${label} runtime.`
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
