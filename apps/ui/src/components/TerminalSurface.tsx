import { useMemo } from 'react';
import type { TerminalSession } from '@agentic-scifi/shared-schema';
import {
  buildTerminalHistory,
  labelForTerminalStatus,
  toneForHistoryState,
  toneForTerminalStatus
} from '../lib/helpers';

interface TerminalSurfaceProps {
  session: TerminalSession | null;
  isRestored: boolean;
  commandSurfaceCount: number;
  onSelectSession: (id: string) => void;
}

export function TerminalSurface({ session, isRestored, commandSurfaceCount, onSelectSession }: TerminalSurfaceProps) {
  const terminalHistory = useMemo(() => buildTerminalHistory(session), [session]);
  const activeCommandCount = terminalHistory.length;
  const latestCommand = terminalHistory[0] ?? null;
  const showsLiveTerminalState = session?.status === 'running' && !isRestored;

  if (!session) {
    return (
      <div className="panel terminal-surface">
        <div className="panel-head terminal-header">
          <div>
            <p className="eyebrow">terminal surface</p>
            <h2>No session</h2>
          </div>
        </div>
        <p>No terminal session yet.</p>
      </div>
    );
  }

  return (
    <div className="panel terminal-surface">
      <div className="panel-head terminal-header">
        <div>
          <p className="eyebrow">terminal surface</p>
          <h2>{session.title}</h2>
        </div>
        <div className="terminal-header-meta">
          <span className={`chip ${toneForTerminalStatus(session.status)}`}>{showsLiveTerminalState ? session.status : `${session.status} snapshot`}</span>
          {isRestored ? <span className="chip restored">resumed</span> : null}
          <span className="chip neutral">{activeCommandCount} commands tracked</span>
        </div>
      </div>

      <div className="terminal-overview-grid">
        <button
          type="button"
          className={isRestored ? 'session-card session-card-active session-card-restored' : 'session-card session-card-active'}
          onClick={() => onSelectSession(session.id)}
        >
          <div className="session-card-head">
            <strong>{session.title}</strong>
            <div className="session-card-badges">
              {isRestored ? <span className="chip restored">restored</span> : null}
              <span className={`chip ${toneForTerminalStatus(session.status)}`}>{session.status}</span>
            </div>
          </div>
          <p>{session.cwd}</p>
          <div className="session-card-meta">
            <span>{session.lines.length} output lines</span>
            <span>{isRestored ? 'loaded from saved state' : latestCommand ? `last: ${latestCommand.command}` : 'no commands yet'}</span>
          </div>
        </button>

        <div className="terminal-state-strip">
          {isRestored ? (
            <div className="state-cell state-cell-wide restored-callout">
              <span className="state-label">resume state</span>
              <strong>Restored transcript — historical until a new command starts</strong>
              <p>This session was loaded from persisted state. Output below is transcript context, not a live shell feed.</p>
            </div>
          ) : null}
          <div className="state-cell">
            <span className="state-label">cwd</span>
            <strong>{session.cwd}</strong>
          </div>
          <div className="state-cell">
            <span className="state-label">session state</span>
            <strong>{labelForTerminalStatus(session.status)}</strong>
          </div>
          <div className="state-cell">
            <span className="state-label">last command</span>
            <strong>{latestCommand?.command ?? 'standby'}</strong>
          </div>
          <div className="state-cell">
            <span className="state-label">command surface</span>
            <strong>{commandSurfaceCount} staged-ready actions</strong>
          </div>
        </div>
      </div>

      <div className="terminal-main-grid">
        <div className="terminal-output-shell">
          <div className={showsLiveTerminalState ? 'terminal-output-topbar' : 'terminal-output-topbar transcript-topbar'}>
            <span>{showsLiveTerminalState ? 'live session feed' : isRestored ? 'restored transcript' : 'session transcript'}</span>
            <small>{showsLiveTerminalState ? `${session.lines.length} lines streaming` : `${session.lines.length} lines loaded`}</small>
          </div>
          <div className="terminal-output">
            {session.lines.map((line, index) => (
              <div key={`${session.id}-${index}`} className={line.startsWith('$ ') ? 'terminal-line prompt-line' : 'terminal-line'}>
                {line}
              </div>
            ))}
          </div>
          <div className={isRestored ? 'terminal-composer composer-disabled' : 'terminal-composer'}>
            <div>
              <p className="eyebrow">composer</p>
              <strong>{isRestored ? 'Restored session is read-only until a new command is staged' : 'Manual input unlocks with the real PTY path'}</strong>
            </div>
            <div className="composer-shell" aria-disabled={isRestored}>
              <span className="composer-prompt">$</span>
              <span className="composer-placeholder">{isRestored ? 'resume by staging a new command…' : 'type command…'}</span>
            </div>
          </div>
        </div>

        <aside className="history-panel">
          <div className="history-panel-head">
            <div>
              <p className="eyebrow">session history</p>
              <h3>Command log</h3>
            </div>
            <span className="chip neutral">{isRestored ? 'restored history' : 'alpha derived'}</span>
          </div>
          <ol className="history-list">
            {terminalHistory.length > 0 ? (
              terminalHistory.map((entry) => (
                <li key={entry.id} className={isRestored && entry.state !== 'running' ? 'history-card restored-history-card' : 'history-card'}>
                  <div className="history-card-head">
                    <strong>{entry.command}</strong>
                    <span className={`chip ${toneForHistoryState(entry.state)}`}>{entry.state}</span>
                  </div>
                  {entry.output.length > 0 ? (
                    <ul className="history-output-list">
                      {entry.output.map((line, lineIndex) => (
                        <li key={`${entry.id}-line-${lineIndex}`}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No output captured yet.</p>
                  )}
                </li>
              ))
            ) : (
              <li className="history-card empty-history-card">
                <strong>No commands recorded yet.</strong>
                <p>Stage one from the command surface and the session history will show up here.</p>
              </li>
            )}
          </ol>
        </aside>
      </div>
    </div>
  );
}
