import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMockAlphaSnapshot } from '@agentic-scifi/test-utils';
import type { AlphaSnapshot } from './index';

// --- Mock snapshot builder ---

test('buildMockAlphaSnapshot returns a valid AlphaSnapshot shape', () => {
  const snapshot = buildMockAlphaSnapshot('test-label');

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

test('buildMockAlphaSnapshot embeds label into command summary', () => {
  const snapshot = buildMockAlphaSnapshot('custom-label');
  const cmd = snapshot.terminalCommands?.[0];

  assert.ok(cmd);
  assert.match(cmd.summary ?? '', /custom-label/);
});

test('buildMockAlphaSnapshot uses default label when none provided', () => {
  const snapshot = buildMockAlphaSnapshot();
  const cmd = snapshot.terminalCommands?.[0];

  assert.ok(cmd);
  assert.match(cmd.summary ?? '', /mock/);
});

test('buildMockAlphaSnapshot includes expected approval count', () => {
  const snapshot = buildMockAlphaSnapshot();

  assert.equal(snapshot.approvals.length, 2);
  assert.ok(snapshot.approvals.every((a) => a.id && a.title && a.risk && a.preview));
});

test('buildMockAlphaSnapshot includes terminal session with lines', () => {
  const snapshot = buildMockAlphaSnapshot();
  const session = snapshot.terminalSessions?.[0];

  assert.ok(session);
  assert.equal(session.id, 'term-1');
  assert.equal(session.source, 'mock');
  assert.ok(session.lines.length > 0);
  assert.ok(session.lines.some((line) => line.includes('alpha shell ready')));
});

test('buildMockAlphaSnapshot terminal command references session', () => {
  const snapshot = buildMockAlphaSnapshot();
  const cmd = snapshot.terminalCommands?.[0];
  const session = snapshot.terminalSessions?.[0];

  assert.ok(cmd);
  assert.ok(session);
  assert.equal(cmd.sessionId, session.id);
  assert.ok(session.commandIds?.includes(cmd.id));
});

test('buildMockAlphaSnapshot events have timestamps', () => {
  const snapshot = buildMockAlphaSnapshot();

  assert.ok(snapshot.events.length > 0);
  snapshot.events.forEach((event) => {
    assert.ok(event.timestamp, `Event ${event.id} missing timestamp`);
    assert.ok(!isNaN(Date.parse(event.timestamp)), `Event ${event.id} has invalid timestamp`);
  });
});

test('buildMockAlphaSnapshot command suggestions have required fields', () => {
  const snapshot = buildMockAlphaSnapshot();

  assert.ok(snapshot.commandSuggestions && snapshot.commandSuggestions.length > 0);
  snapshot.commandSuggestions.forEach((suggestion) => {
    assert.ok(suggestion.intent);
    assert.ok(suggestion.command);
    assert.ok(suggestion.explanation);
    assert.ok(['low', 'medium', 'high'].includes(suggestion.risk));
  });
});

// --- Type exports sanity check ---

test('AlphaSnapshot type is assignable from buildMockAlphaSnapshot', () => {
  const snapshot: AlphaSnapshot = buildMockAlphaSnapshot();
  assert.ok(snapshot);
});
