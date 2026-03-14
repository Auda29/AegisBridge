export type RunStatus =
  | 'queued'
  | 'planning'
  | 'running'
  | 'waiting_tool'
  | 'waiting_approval'
  | 'blocked'
  | 'finished'
  | 'failed';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Project {
  id: string;
  name: string;
  phase: string;
  description?: string;
  nextSteps?: string[];
  decisions?: string[];
}

export interface Task {
  id: string;
  projectId: string;
  goal: string;
  status: 'todo' | 'active' | 'blocked' | 'done';
}

export interface AgentRun {
  id: string;
  taskId: string;
  role: string;
  goal: string;
  status: RunStatus;
  summary?: string;
}

export interface Approval {
  id: string;
  title: string;
  risk: RiskLevel;
  preview: string;
  rationale?: string;
  impact?: string;
  commandPreview?: string;
  diffPreview?: string[];
  rollbackHint?: string;
}

export interface Artifact {
  id: string;
  type: 'note' | 'decision' | 'report' | 'patch' | 'command-bundle';
  title: string;
}

export type TimelineEventCategory = 'system' | 'approval' | 'agent' | 'artifact' | 'command';

export interface TimelineEvent {
  id: string;
  title: string;
  detail: string;
  tone: 'cyan' | 'amber' | 'green' | 'neutral';
  category?: TimelineEventCategory;
  timestamp?: string;
}

export interface CommandSuggestion {
  intent: string;
  command: string;
  explanation: string;
  risk: RiskLevel;
}

export type TerminalSessionStatus = 'idle' | 'running' | 'done' | 'failed';
export type TerminalSessionSource = 'mock' | 'local-shell' | 'pty';
export type TerminalCommandKind = 'suggested' | 'manual' | 'agent-generated';
export type TerminalCommandStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';

export interface TerminalCommand {
  id: string;
  sessionId: string;
  command: string;
  kind: TerminalCommandKind;
  status: TerminalCommandStatus;
  risk: RiskLevel;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number | null;
  summary?: string;
  approvalId?: string;
}

export interface TerminalSession {
  id: string;
  title: string;
  cwd: string;
  status: TerminalSessionStatus;
  lines: string[];
  source: TerminalSessionSource;
  startedAt?: string;
  updatedAt?: string;
  lastCommand?: string;
  lastCommandId?: string;
  commandIds?: string[];
  exitCode?: number | null;
}

export interface AlphaSnapshot {
  project: Project;
  tasks: Task[];
  runs: AgentRun[];
  approvals: Approval[];
  artifacts: Artifact[];
  events: TimelineEvent[];
  commandSuggestions?: CommandSuggestion[];
  terminalSessions?: TerminalSession[];
  terminalCommands?: TerminalCommand[];
}

export interface ApprovalActionResult {
  snapshot: AlphaSnapshot;
  event: TimelineEvent;
}

export interface CommandActionResult {
  snapshot: AlphaSnapshot;
  event: TimelineEvent;
}
