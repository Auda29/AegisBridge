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
