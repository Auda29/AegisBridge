import { useMemo, useState } from 'react';
import type { AlphaSnapshot, Approval } from '@agentic-scifi/shared-schema';
import { toneForRisk } from '../lib/helpers';
import { useBridgeClient } from './BridgeContext';

interface ApprovalPanelProps {
  snapshot: AlphaSnapshot;
  onSnapshotUpdate: (snapshot: AlphaSnapshot) => void;
}

export function ApprovalPanel({ snapshot, onSnapshotUpdate }: ApprovalPanelProps) {
  const client = useBridgeClient();
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(snapshot.approvals[0]?.id ?? null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedApproval = useMemo(
    () => snapshot.approvals.find((a) => a.id === selectedApprovalId) ?? snapshot.approvals[0] ?? null,
    [snapshot, selectedApprovalId]
  );

  async function handleApprovalAction(kind: 'approve' | 'reject') {
    if (!selectedApproval) return;

    setActionError(null);
    try {
      const result = kind === 'approve'
        ? await client.approveApproval(selectedApproval.id)
        : await client.rejectApproval(selectedApproval.id);

      onSnapshotUpdate(result.snapshot);
      setSelectedApprovalId(result.snapshot.approvals[0]?.id ?? null);
      setActionMessage(kind === 'approve' ? 'Approval accepted.' : 'Approval rejected.');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Approval action failed');
    }
  }

  return (
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
        <ApprovalDetail
          approval={selectedApproval}
          actionMessage={actionMessage}
          actionError={actionError}
          onAction={handleApprovalAction}
        />
      ) : (
        <div className="approval-detail">
          <p>No pending approvals. Suspiciously healthy.</p>
          {actionMessage ? <p className="action-message">{actionMessage}</p> : null}
        </div>
      )}
    </section>
  );
}

function ApprovalDetail({
  approval,
  actionMessage,
  actionError,
  onAction
}: {
  approval: Approval;
  actionMessage: string | null;
  actionError: string | null;
  onAction: (kind: 'approve' | 'reject') => void;
}) {
  return (
    <div className="approval-detail">
      <p className="eyebrow">selected approval</p>
      <h3>{approval.title}</h3>
      <p><strong>Why:</strong> {approval.rationale ?? 'Rationale not provided yet.'}</p>
      <p><strong>Impact:</strong> {approval.impact ?? 'Impact scope still undefined.'}</p>
      <div className="detail-block">
        <p className="eyebrow">command preview</p>
        <pre className="code-block">{approval.commandPreview ?? 'No command preview yet.'}</pre>
      </div>
      <div className="detail-block">
        <p className="eyebrow">diff preview</p>
        <ul className="diff-list">
          {(approval.diffPreview ?? ['No diff preview yet.']).map((line, index) => (
            <li key={`diff-${index}`}>{line}</li>
          ))}
        </ul>
      </div>
      <div className="detail-block">
        <p className="eyebrow">rollback hint</p>
        <p>{approval.rollbackHint ?? 'Rollback strategy not defined yet.'}</p>
      </div>
      <div className="approval-actions">
        <button className="action secondary-action" type="button" onClick={() => onAction('reject')}>
          Reject
        </button>
        <button className="action" type="button" onClick={() => onAction('approve')}>
          Approve
        </button>
      </div>
      {actionError ? <p className="action-message error-message">{actionError}</p> : null}
      {actionMessage ? <p className="action-message">{actionMessage}</p> : null}
    </div>
  );
}
