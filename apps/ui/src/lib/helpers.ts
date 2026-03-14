import type { AlphaSnapshot, RiskLevel, TerminalSession, TerminalSessionStatus } from '@agentic-scifi/shared-schema';

export function toneForRunStatus(status: AlphaSnapshot['runs'][number]['status']) {
  switch (status) {
    case 'running':
    case 'planning':
      return 'cyan';
    case 'waiting_approval':
    case 'waiting_tool':
    case 'blocked':
      return 'amber';
    case 'finished':
      return 'green';
    default:
      return 'neutral';
  }
}

export function toneForRisk(risk: RiskLevel) {
  switch (risk) {
    case 'high':
      return 'red';
    case 'medium':
      return 'amber';
    default:
      return 'neutral';
  }
}

export function toneForTerminalStatus(status: TerminalSessionStatus) {
  switch (status) {
    case 'running':
      return 'cyan';
    case 'done':
      return 'green';
    default:
      return 'neutral';
  }
}

export function toneForHistoryState(state: 'running' | 'captured') {
  switch (state) {
    case 'running':
      return 'cyan';
    default:
      return 'neutral';
  }
}

export function formatRunStatus(status: AlphaSnapshot['runs'][number]['status']) {
  return status.replace(/_/g, ' ');
}

export function labelForTerminalStatus(status: TerminalSessionStatus) {
  switch (status) {
    case 'idle':
      return 'ready / standing by';
    case 'running':
      return 'staging / awaiting execution';
    case 'done':
      return 'completed';
    case 'failed':
      return 'failed / needs review';
    default:
      return status;
  }
}

export interface TerminalHistoryEntry {
  id: string;
  command: string;
  output: string[];
  state: 'running' | 'captured';
}

export function buildTerminalHistory(session: TerminalSession | null): TerminalHistoryEntry[] {
  if (!session) return [];

  const entries: TerminalHistoryEntry[] = [];
  let current: TerminalHistoryEntry | null = null;

  session.lines.forEach((line, index) => {
    if (line.startsWith('$ ')) {
      if (current) entries.unshift(current);
      current = {
        id: `${session.id}-cmd-${index}`,
        command: line.slice(2),
        output: [],
        state: index === session.lines.length - 1 && session.status === 'running' ? 'running' : 'captured'
      };
      return;
    }

    if (current) {
      current.output.push(line);
    }
  });

  if (current) entries.unshift(current);

  if (entries.length > 0 && session.status === 'running') {
    entries[0] = {
      ...entries[0],
      state: 'running'
    };
  }

  return entries;
}
