import type { AgentRun } from '@agentic-scifi/shared-schema';
import { formatRunStatus, toneForRunStatus } from '../lib/helpers';

export function AgentBoard({ runs }: { runs: AgentRun[] }) {
  return (
    <div className="panel agent-board">
      <div className="panel-head">
        <div>
          <p className="eyebrow">agent orchestrator</p>
          <h2>Active runs</h2>
        </div>
        <span className="status-dot" />
      </div>
      <div className="run-list">
        {runs.map((run) => (
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
  );
}
