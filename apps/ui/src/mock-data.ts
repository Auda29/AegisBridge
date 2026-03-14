export const alphaProjectSnapshot = {
  project: {
    name: 'Agentic SciFi Command Center',
    phase: 'alpha bootstrap',
    nextSteps: [
      'Wire bridge-fed state into the workspace shell',
      'Add approval detail sheet with command and diff preview',
      'Implement timeline filtering and event persistence'
    ],
    decisions: [
      'Electron for V1 shell',
      'Node runtime bridge for PTY and orchestration',
      'Tactical Minimal as the default visual system'
    ]
  },
  runs: [
    {
      id: 'run-1',
      role: 'Planner',
      status: 'running',
      statusTone: 'cyan',
      goal: 'Sequence week 1 alpha work into shippable slices.',
      summary: 'Waiting on repo bootstrap and schema confirmation.'
    },
    {
      id: 'run-2',
      role: 'Reviewer',
      status: 'waiting approval',
      statusTone: 'amber',
      goal: 'Validate approval UX and risk semantics.',
      summary: 'Needs explicit command preview treatment in UI.'
    },
    {
      id: 'run-3',
      role: 'Runtime',
      status: 'queued',
      statusTone: 'neutral',
      goal: 'Expose mock event stream from bridge to renderer.',
      summary: 'Blocked until typed client contract lands.'
    }
  ],
  events: [
    { id: 'evt-1', title: 'Alpha repo scaffold created', detail: 'Monorepo, UI, bridge, schema and design-system seeds added.', tone: 'green' },
    { id: 'evt-2', title: 'Technical delivery path locked', detail: 'Terminal → Events → Approvals → Artifacts remains the proving loop.', tone: 'cyan' },
    { id: 'evt-3', title: 'Approval queue requires depth view', detail: 'Need command, rationale, impact scope and rollback hints.', tone: 'amber' }
  ],
  approvals: [
    { id: 'ap-1', title: 'Approve architecture spike scope', risk: 'medium', tone: 'amber', preview: 'Boot Electron shell, mock bridge IPC, and event store spike in week 1.' },
    { id: 'ap-2', title: 'Approve alpha UI priorities', risk: 'low', tone: 'neutral', preview: 'Project Workspace first; terminal surface lands before cinematic polish.' }
  ],
  artifacts: [
    'implementation-backlog.md',
    'technical-delivery-plan.md',
    'design-system-and-wireframes.md'
  ]
};
