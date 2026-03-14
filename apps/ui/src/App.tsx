import { useEffect, useMemo, useState } from 'react';
import { createLocalRuntimeBridgeClient } from '@agentic-scifi/client-sdk';
import type { AlphaSnapshot } from '@agentic-scifi/shared-schema';
import { useAlphaSnapshot } from './hooks/use-alpha-snapshot';
import { BridgeProvider, useBridgeClient } from './components/BridgeContext';
import { AgentBoard } from './components/AgentBoard';
import { TimelinePanel } from './components/TimelinePanel';
import { CommandSurface } from './components/CommandSurface';
import { TerminalSurface } from './components/TerminalSurface';
import { ApprovalPanel } from './components/ApprovalPanel';

const nav = ['Home', 'Projects', 'Agents', 'Terminal', 'Knowledge', 'Timeline', 'Systems'];
const bridgeClient = createLocalRuntimeBridgeClient();

export function App() {
  return (
    <BridgeProvider client={bridgeClient}>
      <AppShell />
    </BridgeProvider>
  );
}

function AppShell() {
  const client = useBridgeClient();
  const { snapshot, setSnapshot, status, errorMessage, restoredTerminalIds, setRestoredTerminalIds } = useAlphaSnapshot(client);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);

  const terminalSessions = snapshot?.terminalSessions ?? [];

  useEffect(() => {
    if (!snapshot) return;
    setActiveTerminalId((current) => {
      const ids = new Set(terminalSessions.map((s) => s.id));
      if (current && ids.has(current)) return current;
      return terminalSessions[0]?.id ?? null;
    });
  }, [snapshot, terminalSessions]);

  const activeTerminal = useMemo(
    () => terminalSessions.find((s) => s.id === activeTerminalId) ?? terminalSessions[0] ?? null,
    [terminalSessions, activeTerminalId]
  );

  const isRestoredTerminal = activeTerminal ? restoredTerminalIds.includes(activeTerminal.id) : false;

  async function handleSuggestedCommand(command: string) {
    try {
      const result = await client.runSuggestedCommand(command);
      setSnapshot(result.snapshot);
      setRestoredTerminalIds((current) => current.filter((id) => id !== result.snapshot.terminalSessions?.[0]?.id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Command staging failed';
      setSnapshot((current) => {
        if (!current) return current;
        return {
          ...current,
          events: [{ id: `error-${Date.now()}`, title: 'Command failed', detail: message, tone: 'amber' as const }, ...current.events]
        };
      });
    }
  }

  function handleSnapshotUpdate(updated: AlphaSnapshot) {
    setSnapshot(updated);
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

          <AgentBoard runs={snapshot.runs} />
          <TimelinePanel events={snapshot.events} />
          <CommandSurface
            suggestions={snapshot.commandSuggestions ?? []}
            onStageCommand={(cmd) => void handleSuggestedCommand(cmd)}
          />
          <TerminalSurface
            session={activeTerminal}
            isRestored={isRestoredTerminal}
            commandSurfaceCount={snapshot.commandSuggestions?.length ?? 0}
            onSelectSession={setActiveTerminalId}
          />
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

        <ApprovalPanel snapshot={snapshot} onSnapshotUpdate={handleSnapshotUpdate} />

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
