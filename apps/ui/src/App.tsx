import { useEffect, useMemo, useRef, useState } from 'react';
import { createLocalRuntimeBridgeClient } from '@agentic-scifi/client-sdk';
import type { AlphaSnapshot, TerminalSession, TerminalSessionStatus } from '@agentic-scifi/shared-schema';

const nav = ['Home', 'Projects', 'Agents', 'Terminal', 'Knowledge', 'Timeline', 'Systems'];
const timelineFilters = ['all', 'agent', 'approval', 'artifact', 'system'] as const;
const bridgeClient = createLocalRuntimeBridgeClient();

export function App() {
  const [snapshot, setSnapshot] = useState<AlphaSnapshot | null>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<(typeof timelineFilters)[number]>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [restoredTerminalIds, setRestoredTerminalIds] = useState<string[]>([]);
  const initialSnapshotLoadedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const nextSnapshot = await bridgeClient.getAlphaSnapshot();
        if (!active) return;
        setSnapshot(nextSnapshot);
        setSelectedApprovalId(nextSnapshot.approvals[0]?.id ?? null);
        setActiveTerminalId(nextSnapshot.terminalSessions?.[0]?.id ?? null);
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
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    return bridgeClient.subscribeToEvents((event) => {
      setSnapshot((current) => {
        if (!current) return current;
        if (current.events.some((existing) => existing.id === event.id)) return current;
        return {
          ...current,
          events: [event, ...current.events]
        };
      });
    });
  }, [status]);

  useEffect(() => {
    if (!snapshot) return;

    const terminalIds = new Set((snapshot.terminalSessions ?? []).map((session) => session.id));
    if (!activeTerminalId || !terminalIds.has(activeTerminalId)) {
      setActiveTerminalId(snapshot.terminalSessions?.[0]?.id ?? null);
    }
  }, [snapshot, activeTerminalId]);

  const selectedApproval = useMemo(
    () => snapshot?.approvals.find((approval) => approval.id === selectedApprovalId) ?? snapshot?.approvals[0] ?? null,
    [snapshot, selectedApprovalId]
  );

  const filteredEvents = useMemo(() => {
    if (!snapshot) return [];
    if (timelineFilter === 'all') return snapshot.events;
    return snapshot.events.filter((event) => event.category === timelineFilter);
  }, [snapshot, timelineFilter]);

  const terminalSessions = snapshot?.terminalSessions ?? [];

  const activeTerminal = useMemo(
    () => terminalSessions.find((session) => session.id === activeTerminalId) ?? terminalSessions[0] ?? null,
    [terminalSessions, activeTerminalId]
  );

  const terminalHistory = useMemo(() => buildTerminalHistory(activeTerminal), [activeTerminal]);
  const activeCommandCount = terminalHistory.length;
  const latestCommand = terminalHistory[0] ?? null;
  const commandSurfaceCount = snapshot?.commandSuggestions?.length ?? 0;
  const isRestoredTerminal = activeTerminal ? restoredTerminalIds.includes(activeTerminal.id) : false;
  const showsLiveTerminalState = activeTerminal?.status === 'running' && !isRestoredTerminal;

  async function handleApprovalAction(kind: 'approve' | 'reject') {
    if (!selectedApproval) return;

    const result = kind === 'approve'
      ? await bridgeClient.approveApproval(selectedApproval.id)
      : await bridgeClient.rejectApproval(selectedApproval.id);

    setSnapshot(result.snapshot);
    setSelectedApprovalId(result.snapshot.approvals[0]?.id ?? null);
    setActionMessage(kind === 'approve' ? 'Approval accepted.' : 'Approval rejected.');
  }

  async function handleSuggestedCommand(command: string) {
    const result = await bridgeClient.runSuggestedCommand(command);
    setSnapshot(result.snapshot);
    setRestoredTerminalIds((current) => current.filter((id) => id !== result.snapshot.terminalSessions?.[0]?.id));
    setActionMessage(`Command staged: ${command}`);
  }

  if (status === 'loading' || snapshot === null) {
    return (
      <div className="shell loading-shell">
        <main className="workspace">
          <section className="panel loading-panel">
            <p className="eyebrow">bridge handshake</p>
            <h1>Loading alpha workspace…</h1>
            <p>Pulling the current project snapshot from the local runtime bridge.</p>
          </section>
        </main>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="shell loading-shell">
        <main className="workspace">
          <section className="panel loading-panel error-panel">
            <p className="eyebrow">bridge failure</p>
            <h1>Alpha workspace failed to load</h1>
            <p>{errorMessage}</p>
          </section>
        </main>
      </div>
    );
  }

  const project = snapshot.project;

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <div className="brand-mark">◢</div>
          <div>
            <strong>Aegis</strong>
            <span>alpha</span>
          </div>
        </div>
        <nav>
          {nav.map((item) => (
            <button key={item} className={item === 'Projects' ? 'nav-item active' : 'nav-item'}>
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        <header className="topbar panel">
          <div>
            <p className="eyebrow">project workspace</p>
            <h1>{project.name}</h1>
          </div>
          <div className="topbar-meta">
            <span className="chip cyan">{project.phase}</span>
            <span className="chip amber">{snapshot.approvals.length} approvals pending</span>
            <span className="chip neutral">bridge-fed alpha</span>
          </div>
        </header>

        <section className="center-grid">
          <div className="panel hero">
            <div className="panel-head">
              <div>
                <p className="eyebrow">mission</p>
                <h2>{project.description ?? 'Build a trustworthy agentic command center'}</h2>
              </div>
              <button className="action">Start run</button>
            </div>
            <div className="hero-columns">
              <div>
                <h3>Next steps</h3>
                <ul>
                  {(project.nextSteps ?? []).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Open decisions</h3>
                <ul>
                  {(project.decisions ?? []).map((decision) => (
                    <li key={decision}>{decision}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="panel agent-board">
            <div className="panel-head">
              <div>
                <p className="eyebrow">agent orchestrator</p>
                <h2>Active runs</h2>
              </div>
              <span className="status-dot" />
            </div>
            <div className="run-list">
              {snapshot.runs.map((run) => (
                <article className="run-card" key={run.id}>
                  <div className="run-title">
                    <strong>{run.role}</strong>
                    <span className={`chip ${toneForRunStatus(run.status)}`}>{formatRunStatus(run.status)}</span>
                  </div>
                  <p>{run.goal}</p>
                  <small>{run.summary ?? 'No run summary yet.'}</small>
                </article>
              ))}
            </div>
          </div>

          <div className="panel timeline">
            <div className="panel-head">
              <div>
                <p className="eyebrow">mission timeline</p>
                <h2>Recent events</h2>
              </div>
            </div>
            <div className="filter-row">
              {timelineFilters.map((filter) => (
                <button
                  key={filter}
                  className={timelineFilter === filter ? 'filter-chip active-filter' : 'filter-chip'}
                  type="button"
                  onClick={() => setTimelineFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <ol className="event-list">
              {filteredEvents.map((event) => (
                <li key={event.id}>
                  <span className={`event-pip ${event.tone}`} />
                  <div>
                    <div className="event-headline">
                      <strong>{event.title}</strong>
                      <span className="event-category">{event.category ?? 'uncategorized'}</span>
                    </div>
                    <p>{event.detail}</p>
                    {event.timestamp ? <small>{new Date(event.timestamp).toLocaleTimeString()}</small> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="panel command-surface">
            <div className="panel-head">
              <div>
                <p className="eyebrow">command surface</p>
                <h2>Suggested actions</h2>
              </div>
            </div>
            <div className="command-list">
              {(snapshot.commandSuggestions ?? []).map((suggestion) => (
                <div className="command-card" key={suggestion.command}>
                  <div className="run-title">
                    <strong>{suggestion.intent}</strong>
                    <span className={`chip ${toneForRisk(suggestion.risk)}`}>{suggestion.risk}</span>
                  </div>
                  <pre className="code-block compact-code">{suggestion.command}</pre>
                  <p>{suggestion.explanation}</p>
                  <button className="action" type="button" onClick={() => void handleSuggestedCommand(suggestion.command)}>
                    Stage command
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel terminal-surface">
            <div className="panel-head terminal-header">
              <div>
                <p className="eyebrow">terminal surface</p>
                <h2>{activeTerminal?.title ?? 'No session'}</h2>
              </div>
              <div className="terminal-header-meta">
                {activeTerminal ? <span className={`chip ${toneForTerminalStatus(activeTerminal.status)}`}>{showsLiveTerminalState ? activeTerminal.status : `${activeTerminal.status} snapshot`}</span> : null}
                {isRestoredTerminal ? <span className="chip restored">resumed</span> : null}
                <span className="chip neutral">{activeCommandCount} commands tracked</span>
              </div>
            </div>

            {activeTerminal ? (
              <>
                <div className="terminal-overview-grid">
                  <button
                    type="button"
                    className={isRestoredTerminal ? 'session-card session-card-active session-card-restored' : 'session-card session-card-active'}
                    onClick={() => setActiveTerminalId(activeTerminal.id)}
                  >
                    <div className="session-card-head">
                      <strong>{activeTerminal.title}</strong>
                      <div className="session-card-badges">
                        {isRestoredTerminal ? <span className="chip restored">restored</span> : null}
                        <span className={`chip ${toneForTerminalStatus(activeTerminal.status)}`}>{activeTerminal.status}</span>
                      </div>
                    </div>
                    <p>{activeTerminal.cwd}</p>
                    <div className="session-card-meta">
                      <span>{activeTerminal.lines.length} output lines</span>
                      <span>{isRestoredTerminal ? 'loaded from saved state' : latestCommand ? `last: ${latestCommand.command}` : 'no commands yet'}</span>
                    </div>
                  </button>

                  <div className="terminal-state-strip">
                    {isRestoredTerminal ? (
                      <div className="state-cell state-cell-wide restored-callout">
                        <span className="state-label">resume state</span>
                        <strong>Restored transcript — historical until a new command starts</strong>
                        <p>This session was loaded from persisted state. Output below is transcript context, not a live shell feed.</p>
                      </div>
                    ) : null}
                    <div className="state-cell">
                      <span className="state-label">cwd</span>
                      <strong>{activeTerminal.cwd}</strong>
                    </div>
                    <div className="state-cell">
                      <span className="state-label">session state</span>
                      <strong>{labelForTerminalStatus(activeTerminal.status)}</strong>
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
                      <span>{showsLiveTerminalState ? 'live session feed' : isRestoredTerminal ? 'restored transcript' : 'session transcript'}</span>
                      <small>{showsLiveTerminalState ? `${activeTerminal.lines.length} lines streaming` : `${activeTerminal.lines.length} lines loaded`}</small>
                    </div>
                    <div className="terminal-output">
                      {activeTerminal.lines.map((line, index) => (
                        <div key={`${activeTerminal.id}-${index}`} className={line.startsWith('$ ') ? 'terminal-line prompt-line' : 'terminal-line'}>
                          {line}
                        </div>
                      ))}
                    </div>
                    <div className={isRestoredTerminal ? 'terminal-composer composer-disabled' : 'terminal-composer'}>
                      <div>
                        <p className="eyebrow">composer</p>
                        <strong>{isRestoredTerminal ? 'Restored session is read-only until a new command is staged' : 'Manual input unlocks with the real PTY path'}</strong>
                      </div>
                      <div className="composer-shell" aria-disabled={isRestoredTerminal}>
                        <span className="composer-prompt">$</span>
                        <span className="composer-placeholder">{isRestoredTerminal ? 'resume by staging a new command…' : 'type command…'}</span>
                      </div>
                    </div>
                  </div>

                  <aside className="history-panel">
                    <div className="history-panel-head">
                      <div>
                        <p className="eyebrow">session history</p>
                        <h3>Command log</h3>
                      </div>
                      <span className="chip neutral">{isRestoredTerminal ? 'restored history' : 'alpha derived'}</span>
                    </div>
                    <ol className="history-list">
                      {terminalHistory.length > 0 ? (
                        terminalHistory.map((entry) => (
                          <li key={entry.id} className={isRestoredTerminal && entry.state !== 'running' ? 'history-card restored-history-card' : 'history-card'}>
                            <div className="history-card-head">
                              <strong>{entry.command}</strong>
                              <span className={`chip ${toneForHistoryState(entry.state)}`}>{entry.state}</span>
                            </div>
                            {entry.output.length > 0 ? (
                              <ul className="history-output-list">
                                {entry.output.map((line) => (
                                  <li key={`${entry.id}-${line}`}>{line}</li>
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
              </>
            ) : (
              <p>No terminal session yet.</p>
            )}
          </div>
        </section>
      </main>

      <aside className="context">
        <section className="panel">
          <p className="eyebrow">context stack</p>
          <h2>Project context</h2>
          <ul className="metric-list">
            <li><span>Tasks</span><strong>{snapshot.tasks.length}</strong></li>
            <li><span>Runs</span><strong>{snapshot.runs.length}</strong></li>
            <li><span>Storage</span><strong>SQLite + Markdown</strong></li>
          </ul>
        </section>

        <section className="panel">
          <p className="eyebrow">approvals</p>
          <h2>Queue</h2>
          <div className="approval-list">
            {snapshot.approvals.map((approval) => (
              <button
                key={approval.id}
                className={approval.id === selectedApproval?.id ? 'approval-card active-approval' : 'approval-card approval-button'}
                onClick={() => setSelectedApprovalId(approval.id)}
                type="button"
              >
                <div className="approval-head">
                  <strong>{approval.title}</strong>
                  <span className={`chip ${toneForRisk(approval.risk)}`}>{approval.risk}</span>
                </div>
                <p>{approval.preview}</p>
              </button>
            ))}
          </div>
          {selectedApproval ? (
            <div className="approval-detail">
              <p className="eyebrow">selected approval</p>
              <h3>{selectedApproval.title}</h3>
              <p><strong>Why:</strong> {selectedApproval.rationale ?? 'Rationale not provided yet.'}</p>
              <p><strong>Impact:</strong> {selectedApproval.impact ?? 'Impact scope still undefined.'}</p>
              <div className="detail-block">
                <p className="eyebrow">command preview</p>
                <pre className="code-block">{selectedApproval.commandPreview ?? 'No command preview yet.'}</pre>
              </div>
              <div className="detail-block">
                <p className="eyebrow">diff preview</p>
                <ul className="diff-list">
                  {(selectedApproval.diffPreview ?? ['No diff preview yet.']).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <div className="detail-block">
                <p className="eyebrow">rollback hint</p>
                <p>{selectedApproval.rollbackHint ?? 'Rollback strategy not defined yet.'}</p>
              </div>
              <div className="approval-actions">
                <button className="action secondary-action" type="button" onClick={() => void handleApprovalAction('reject')}>
                  Reject
                </button>
                <button className="action" type="button" onClick={() => void handleApprovalAction('approve')}>
                  Approve
                </button>
              </div>
              {actionMessage ? <p className="action-message">{actionMessage}</p> : null}
            </div>
          ) : (
            <div className="approval-detail">
              <p>No pending approvals. Suspiciously healthy.</p>
              {actionMessage ? <p className="action-message">{actionMessage}</p> : null}
            </div>
          )}
        </section>

        <section className="panel">
          <p className="eyebrow">knowledge capture</p>
          <h2>Artifacts</h2>
          <ul>
            {snapshot.artifacts.map((artifact) => (
              <li key={artifact.id}>{artifact.title}</li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function toneForRunStatus(status: AlphaSnapshot['runs'][number]['status']) {
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

function toneForRisk(risk: 'low' | 'medium' | 'high') {
  switch (risk) {
    case 'high':
      return 'amber';
    case 'medium':
      return 'amber';
    default:
      return 'neutral';
  }
}

function toneForTerminalStatus(status: TerminalSessionStatus) {
  switch (status) {
    case 'running':
      return 'cyan';
    case 'done':
      return 'green';
    default:
      return 'neutral';
  }
}

function toneForHistoryState(state: 'running' | 'captured') {
  switch (state) {
    case 'running':
      return 'cyan';
    default:
      return 'neutral';
  }
}

function formatRunStatus(status: AlphaSnapshot['runs'][number]['status']) {
  return status.replace('_', ' ');
}

function labelForTerminalStatus(status: TerminalSessionStatus) {
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

function buildTerminalHistory(session: TerminalSession | null) {
  if (!session) return [];

  const entries: Array<{ id: string; command: string; output: string[]; state: 'running' | 'captured' }> = [];
  let current: { id: string; command: string; output: string[]; state: 'running' | 'captured' } | null = null;

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
