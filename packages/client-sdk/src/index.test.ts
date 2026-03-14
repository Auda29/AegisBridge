import test from 'node:test';
import assert from 'node:assert/strict';

import { createLocalRuntimeBridgeClient } from './index';
import type { TimelineEvent } from '@agentic-scifi/shared-schema';

// --- Snapshot retrieval ---

test('getAlphaSnapshot returns a valid snapshot with all required fields', async () => {
  const client = createLocalRuntimeBridgeClient();
  const snapshot = await client.getAlphaSnapshot();

  assert.ok(snapshot.project);
  assert.equal(snapshot.project.id, 'project-alpha');
  assert.ok(Array.isArray(snapshot.tasks));
  assert.ok(Array.isArray(snapshot.runs));
  assert.ok(Array.isArray(snapshot.approvals));
  assert.ok(Array.isArray(snapshot.artifacts));
  assert.ok(Array.isArray(snapshot.events));
  assert.ok(Array.isArray(snapshot.commandSuggestions));
  assert.ok(Array.isArray(snapshot.terminalSessions));
  assert.ok(Array.isArray(snapshot.terminalCommands));
});

// --- Approval actions ---

test('approveApproval removes the approval and returns acceptance event', async () => {
  const client = createLocalRuntimeBridgeClient();
  const before = await client.getAlphaSnapshot();
  const target = before.approvals[0];
  assert.ok(target);

  const result = await client.approveApproval(target.id);

  assert.equal(result.snapshot.approvals.some((a) => a.id === target.id), false);
  assert.equal(result.event.category, 'approval');
  assert.match(result.event.title, /accepted/i);
});

test('rejectApproval removes the approval and returns rejection event', async () => {
  const client = createLocalRuntimeBridgeClient();
  const before = await client.getAlphaSnapshot();
  const target = before.approvals[0];
  assert.ok(target);

  const result = await client.rejectApproval(target.id);

  assert.equal(result.snapshot.approvals.some((a) => a.id === target.id), false);
  assert.equal(result.event.category, 'approval');
  assert.match(result.event.title, /rejected/i);
});

// --- Input validation ---

test('approveApproval throws on empty string', async () => {
  const client = createLocalRuntimeBridgeClient();
  await assert.rejects(() => client.approveApproval(''), /non-empty approvalId/);
});

test('rejectApproval throws on empty string', async () => {
  const client = createLocalRuntimeBridgeClient();
  await assert.rejects(() => client.rejectApproval(''), /non-empty approvalId/);
});

test('runSuggestedCommand throws on empty string', async () => {
  const client = createLocalRuntimeBridgeClient();
  await assert.rejects(() => client.runSuggestedCommand(''), /non-empty command/);
});

// --- Command execution ---

test('runSuggestedCommand stages a command and updates terminal state', async () => {
  const client = createLocalRuntimeBridgeClient();
  const before = await client.getAlphaSnapshot();
  const beforeCmdCount = before.terminalCommands?.length ?? 0;

  const result = await client.runSuggestedCommand('npm run build:ui');
  const afterSession = result.snapshot.terminalSessions?.[0];
  const latestCmd = result.snapshot.terminalCommands?.[0];

  assert.ok(afterSession);
  assert.ok(latestCmd);
  assert.equal(latestCmd.command, 'npm run build:ui');
  assert.equal(latestCmd.status, 'queued');
  assert.equal(afterSession.status, 'running');
  assert.equal(afterSession.lastCommand, 'npm run build:ui');
  assert.equal((result.snapshot.terminalCommands?.length ?? 0), beforeCmdCount + 1);
  assert.equal(result.event.category, 'command');
});

test('runSuggestedCommand uses matched suggestion risk level', async () => {
  const client = createLocalRuntimeBridgeClient();

  // 'npm run build:ui' is a known suggestion with risk 'low'
  const result = await client.runSuggestedCommand('npm run build:ui');
  const cmd = result.snapshot.terminalCommands?.[0];
  assert.ok(cmd);
  assert.equal(cmd.risk, 'low');
});

test('runSuggestedCommand defaults to medium risk for unknown commands', async () => {
  const client = createLocalRuntimeBridgeClient();

  const result = await client.runSuggestedCommand('unknown-command');
  const cmd = result.snapshot.terminalCommands?.[0];
  assert.ok(cmd);
  assert.equal(cmd.risk, 'medium');
});

// --- Event subscription ---

test('subscribeToEvents returns an unsubscribe function', () => {
  const client = createLocalRuntimeBridgeClient();
  const events: TimelineEvent[] = [];

  const unsubscribe = client.subscribeToEvents((event) => {
    events.push(event);
  });

  assert.equal(typeof unsubscribe, 'function');
  unsubscribe();
});

test('subscribeToEvents delivers events from actions', async () => {
  const client = createLocalRuntimeBridgeClient();
  const events: TimelineEvent[] = [];

  const unsubscribe = client.subscribeToEvents((event) => {
    events.push(event);
  });

  await client.runSuggestedCommand('echo test');
  unsubscribe();

  assert.ok(events.length >= 1);
  assert.equal(events[0].category, 'command');
});

test('unsubscribe stops event delivery', async () => {
  const client = createLocalRuntimeBridgeClient();
  const events: TimelineEvent[] = [];

  const unsubscribe = client.subscribeToEvents((event) => {
    events.push(event);
  });
  unsubscribe();

  await client.runSuggestedCommand('echo test');

  assert.equal(events.length, 0);
});

// --- Global bridge override ---

test('createLocalRuntimeBridgeClient uses global override when available', async () => {
  const mockSnapshot = (await import('@agentic-scifi/test-utils')).buildMockAlphaSnapshot('global-override');
  const mockClient = {
    async getAlphaSnapshot() { return mockSnapshot; },
    subscribeToEvents() { return () => {}; },
    async approveApproval() { return { snapshot: mockSnapshot, event: mockSnapshot.events[0] }; },
    async rejectApproval() { return { snapshot: mockSnapshot, event: mockSnapshot.events[0] }; },
    async runSuggestedCommand() { return { snapshot: mockSnapshot, event: mockSnapshot.events[0] }; }
  };

  globalThis.__ASCC_RUNTIME_BRIDGE__ = mockClient;
  try {
    const client = createLocalRuntimeBridgeClient();
    const snapshot = await client.getAlphaSnapshot();
    assert.ok(snapshot.project);
  } finally {
    globalThis.__ASCC_RUNTIME_BRIDGE__ = undefined;
  }
});
