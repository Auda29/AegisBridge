import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { createRuntimeBridge } from './index';
import { InMemorySnapshotStorage, LocalFileSnapshotStorage, JsonFileSnapshotStorage } from './storage';

test('runSuggestedCommand appends command history and terminal session metadata', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());

  const before = await bridge.getAlphaSnapshot();
  const beforeSession = before.terminalSessions?.[0];
  assert.ok(beforeSession);
  const beforeCommandCount = before.terminalCommands?.length ?? 0;

  const result = await bridge.runSuggestedCommand('npm run build:ui');
  const afterSession = result.snapshot.terminalSessions?.[0];
  const latestCommand = result.snapshot.terminalCommands?.[0];

  assert.ok(afterSession);
  assert.ok(latestCommand);
  assert.equal(result.event.category, 'command');
  assert.equal(afterSession.status, 'running');
  assert.equal(afterSession.lastCommand, 'npm run build:ui');
  assert.equal(afterSession.lastCommandId, latestCommand.id);
  assert.equal((result.snapshot.terminalCommands?.length ?? 0), beforeCommandCount + 1);
  assert.ok(afterSession.lines.some((line) => line.includes('npm run build:ui')));
});

test('approval actions remove the approval and append an approval event', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());
  const before = await bridge.getAlphaSnapshot();
  const targetApproval = before.approvals[0];
  assert.ok(targetApproval);

  const result = await bridge.approveApproval(targetApproval.id);

  assert.equal(result.snapshot.approvals.some((approval) => approval.id === targetApproval.id), false);
  assert.equal(result.event.category, 'approval');
  assert.match(result.event.title, /accepted/i);
});

test('storage-backed bridge restores saved state on new bridge instance', async () => {
  const storage = new InMemorySnapshotStorage();
  const firstBridge = createRuntimeBridge(storage);

  await firstBridge.runSuggestedCommand('find . -maxdepth 3 -type f | sort');

  const secondBridge = createRuntimeBridge(storage);
  const restored = await secondBridge.getAlphaSnapshot();

  assert.ok(restored.terminalCommands?.some((command) => command.command === 'find . -maxdepth 3 -type f | sort'));
  assert.ok(restored.events.some((event) => event.category === 'command'));
});

test('local file storage persists snapshots across bridge instances', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'runtime-bridge-'));
  const snapshotFile = join(tempDir, 'alpha-snapshot.json');
  const storage = new LocalFileSnapshotStorage(snapshotFile);

  try {
    const firstBridge = createRuntimeBridge(storage);
    await firstBridge.runSuggestedCommand('npm run build:ui');
    await firstBridge.rejectApproval('approval-1');

    const secondBridge = createRuntimeBridge(new LocalFileSnapshotStorage(snapshotFile));
    const restored = await secondBridge.getAlphaSnapshot();
    const persistedFile = await readFile(snapshotFile, 'utf8');

    assert.match(persistedFile, /"version": 1/);
    assert.ok(restored.terminalCommands?.some((command) => command.command === 'npm run build:ui'));
    assert.equal(restored.approvals.some((approval) => approval.id === 'approval-1'), false);
    assert.ok(restored.events.some((event) => /rejected/i.test(event.title)));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

// --- Input validation tests ---

test('approveApproval throws on empty string', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());
  await assert.rejects(() => bridge.approveApproval(''), /non-empty approvalId/);
});

test('rejectApproval throws on empty string', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());
  await assert.rejects(() => bridge.rejectApproval(''), /non-empty approvalId/);
});

test('runSuggestedCommand throws on empty string', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());
  await assert.rejects(() => bridge.runSuggestedCommand(''), /non-empty command/);
});

// --- Reject approval flow ---

test('rejectApproval removes the approval and emits rejection event', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());
  const before = await bridge.getAlphaSnapshot();
  const targetApproval = before.approvals[1];
  assert.ok(targetApproval);

  const result = await bridge.rejectApproval(targetApproval.id);

  assert.equal(result.snapshot.approvals.some((a) => a.id === targetApproval.id), false);
  assert.equal(result.event.category, 'approval');
  assert.match(result.event.title, /rejected/i);
  assert.match(result.event.detail, new RegExp(targetApproval.title));
});

// --- Approving unknown ID still works gracefully ---

test('approveApproval with unknown id removes nothing and notes unknown', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());
  const before = await bridge.getAlphaSnapshot();
  const approvalCount = before.approvals.length;

  const result = await bridge.approveApproval('nonexistent-id');

  assert.equal(result.snapshot.approvals.length, approvalCount);
  assert.match(result.event.detail, /unknown/i);
});

// --- Event subscription ---

test('subscribeToEvents delivers heartbeat event after timeout', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());
  const events: import('@agentic-scifi/shared-schema').TimelineEvent[] = [];

  const unsubscribe = bridge.subscribeToEvents((event) => {
    events.push(event);
  });

  // Wait for the heartbeat (1800ms timer + some margin)
  await new Promise((resolve) => setTimeout(resolve, 2200));
  unsubscribe();

  assert.ok(events.length >= 1, 'Expected at least one heartbeat event');
  assert.equal(events[0].category, 'system');
  assert.match(events[0].title, /pulse/i);
});

test('unsubscribe prevents further event delivery', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());
  const events: import('@agentic-scifi/shared-schema').TimelineEvent[] = [];

  const unsubscribe = bridge.subscribeToEvents((event) => {
    events.push(event);
  });
  unsubscribe();

  // Wait past the heartbeat window
  await new Promise((resolve) => setTimeout(resolve, 2200));

  assert.equal(events.length, 0, 'No events should be delivered after unsubscribe');
});

// --- Command risk matching ---

test('runSuggestedCommand uses matched suggestion risk level', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());

  // 'npm run build:ui' is a known suggestion with risk 'low'
  const result = await bridge.runSuggestedCommand('npm run build:ui');
  const cmd = result.snapshot.terminalCommands?.[0];

  assert.ok(cmd);
  assert.equal(cmd.risk, 'low');
});

test('runSuggestedCommand defaults to medium risk for unknown commands', async () => {
  const bridge = createRuntimeBridge(new InMemorySnapshotStorage());

  const result = await bridge.runSuggestedCommand('rm -rf /');
  const cmd = result.snapshot.terminalCommands?.[0];

  assert.ok(cmd);
  assert.equal(cmd.risk, 'medium');
});

// --- Storage edge cases ---

test('InMemorySnapshotStorage returns null on first load', async () => {
  const storage = new InMemorySnapshotStorage();
  const result = await storage.load();
  assert.equal(result, null);
});

test('LocalFileSnapshotStorage load returns null for nonexistent file', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'runtime-bridge-missing-'));
  try {
    const storage = new LocalFileSnapshotStorage(join(tempDir, 'does-not-exist.json'));
    const result = await storage.load();
    assert.equal(result, null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('LocalFileSnapshotStorage load throws on corrupt JSON', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'runtime-bridge-corrupt-'));
  const filePath = join(tempDir, 'corrupt.json');
  const { writeFile: writeFileSync } = await import('node:fs/promises');
  await writeFileSync(filePath, 'not valid json {{{', 'utf8');

  try {
    const storage = new LocalFileSnapshotStorage(filePath);
    await assert.rejects(() => storage.load(), /Failed to load snapshot/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('LocalFileSnapshotStorage clear removes the file', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'runtime-bridge-clear-'));
  const filePath = join(tempDir, 'snapshot.json');
  const storage = new LocalFileSnapshotStorage(filePath);

  try {
    const bridge = createRuntimeBridge(storage);
    await bridge.runSuggestedCommand('echo hello');

    await storage.clear();
    const afterClear = await storage.load();
    assert.equal(afterClear, null);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('json file storage persists and restores snapshots correctly', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'runtime-bridge-json-'));
  const snapshotFile = join(tempDir, 'alpha-state.json');
  const storage = new JsonFileSnapshotStorage(snapshotFile);

  try {
    const bridge = createRuntimeBridge(storage);
    await bridge.runSuggestedCommand('find . -maxdepth 3 -type f | sort');

    const restored = await new JsonFileSnapshotStorage(snapshotFile).load();
    assert.ok(restored);
    assert.ok(restored.terminalCommands?.some((command) => command.command === 'find . -maxdepth 3 -type f | sort'));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
