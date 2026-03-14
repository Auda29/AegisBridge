import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { AlphaSnapshot } from '@agentic-scifi/shared-schema';

export interface SnapshotStorage {
  load(): Promise<AlphaSnapshot | null>;
  save(snapshot: AlphaSnapshot): Promise<void>;
}

interface PersistedSnapshotEnvelope {
  version: 1;
  savedAt: string;
  snapshot: AlphaSnapshot;
}

function isPersistedSnapshotEnvelope(value: unknown): value is PersistedSnapshotEnvelope {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<PersistedSnapshotEnvelope>;
  return candidate.version === 1 && !!candidate.snapshot;
}

export class InMemorySnapshotStorage implements SnapshotStorage {
  private current: AlphaSnapshot | null = null;

  async load(): Promise<AlphaSnapshot | null> {
    return this.current;
  }

  async save(snapshot: AlphaSnapshot): Promise<void> {
    this.current = snapshot;
  }
}

export class LocalFileSnapshotStorage implements SnapshotStorage {
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async load(): Promise<AlphaSnapshot | null> {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as PersistedSnapshotEnvelope | AlphaSnapshot;

      if (isPersistedSnapshotEnvelope(parsed)) {
        return parsed.snapshot;
      }

      return parsed as AlphaSnapshot;
    } catch (error) {
      if (isMissingFileError(error)) {
        return null;
      }

      throw new Error(`Failed to load snapshot from ${this.filePath}: ${getErrorMessage(error)}`);
    }
  }

  async save(snapshot: AlphaSnapshot): Promise<void> {
    this.writeChain = this.writeChain
      .then(async () => {
        await mkdir(dirname(this.filePath), { recursive: true });

        const tempFilePath = `${this.filePath}.tmp`;
        const payload: PersistedSnapshotEnvelope = {
          version: 1,
          savedAt: new Date().toISOString(),
          snapshot
        };

        await writeFile(tempFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        await rename(tempFilePath, this.filePath);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to persist snapshot to ${this.filePath}: ${message}`);
      });

    return this.writeChain;
  }

  async clear(): Promise<void> {
    await rm(this.filePath, { force: true });
  }
}

export class JsonFileSnapshotStorage extends LocalFileSnapshotStorage {}

function isMissingFileError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT';
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
