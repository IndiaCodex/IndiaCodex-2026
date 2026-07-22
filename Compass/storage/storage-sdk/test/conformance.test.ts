import { describe, expect, it } from 'vitest';
import { toSnapshotId } from '@compass/domain';
import { InMemorySnapshotRepository } from '@compass/testing';
import { checkSnapshotRepositoryConformance } from '../src/conformance.js';
import type { Snapshot, SnapshotId } from '@compass/domain';
import type { SnapshotFilter, SnapshotRepositoryPort, SnapshotSummary } from '@compass/application';

describe('checkSnapshotRepositoryConformance', () => {
  it('reports no violations for a correct implementation', async () => {
    const violations = await checkSnapshotRepositoryConformance(new InMemorySnapshotRepository());
    expect(violations).toEqual([]);
  });

  it('flags a repository whose getLatest() is non-null before anything is saved', async () => {
    const fakeSnapshot = { id: toSnapshotId('phantom') } as unknown as Snapshot;
    const repo: SnapshotRepositoryPort = {
      save: () => Promise.resolve(),
      getLatest: () => Promise.resolve(fakeSnapshot),
      getById: () => Promise.resolve(null),
      list: () => Promise.resolve([]),
    };
    const violations = await checkSnapshotRepositoryConformance(repo);
    expect(violations).toContainEqual(expect.objectContaining({ rule: 'fresh-repository-has-no-latest' }));
  });

  it('flags a repository that fabricates a result for an unknown id', async () => {
    const fakeSnapshot = { id: toSnapshotId('phantom') } as unknown as Snapshot;
    const repo: SnapshotRepositoryPort = {
      save: () => Promise.resolve(),
      getLatest: () => Promise.resolve(null),
      getById: () => Promise.resolve(fakeSnapshot),
      list: () => Promise.resolve([]),
    };
    const violations = await checkSnapshotRepositoryConformance(repo);
    expect(violations).toContainEqual(expect.objectContaining({ rule: 'unknown-id-returns-null' }));
  });

  it('flags a repository whose getById does not round-trip what was saved', async () => {
    class BrokenRoundTrip implements SnapshotRepositoryPort {
      private saved: Snapshot | null = null;
      save(snapshot: Snapshot): Promise<void> {
        this.saved = snapshot;
        return Promise.resolve();
      }
      getLatest(): Promise<Snapshot | null> {
        return Promise.resolve(this.saved);
      }
      getById(id: SnapshotId): Promise<Snapshot | null> {
        if (this.saved?.id !== id) return Promise.resolve(null);
        // Corrupts the round trip by dropping a field.
        return Promise.resolve({ ...this.saved, components: [{ corrupted: true } as never] });
      }
      list(): Promise<readonly SnapshotSummary[]> {
        return Promise.resolve(this.saved ? [{ id: this.saved.id, createdAt: this.saved.createdAt }] : []);
      }
    }
    const violations = await checkSnapshotRepositoryConformance(new BrokenRoundTrip());
    expect(violations).toContainEqual(expect.objectContaining({ rule: 'save-then-get-by-id-round-trips' }));
  });

  it('flags a repository whose getLatest does not return the most recently created snapshot', async () => {
    class BrokenLatest implements SnapshotRepositoryPort {
      private snapshots: Snapshot[] = [];
      save(snapshot: Snapshot): Promise<void> {
        this.snapshots.push(snapshot);
        return Promise.resolve();
      }
      getLatest(): Promise<Snapshot | null> {
        // Always returns the *first* saved snapshot, ignoring createdAt entirely.
        return Promise.resolve(this.snapshots[0] ?? null);
      }
      getById(id: SnapshotId): Promise<Snapshot | null> {
        return Promise.resolve(this.snapshots.find((s) => s.id === id) ?? null);
      }
      list(): Promise<readonly SnapshotSummary[]> {
        return Promise.resolve(this.snapshots.map((s) => ({ id: s.id, createdAt: s.createdAt })));
      }
    }
    const violations = await checkSnapshotRepositoryConformance(new BrokenLatest());
    // Both the initial round-trip expectation and the "tracks created-at" expectation are violated
    // by always returning the first-saved snapshot.
    expect(violations.length).toBeGreaterThan(0);
  });

  it('flags a repository whose list() omits saved snapshots', async () => {
    class BrokenList implements SnapshotRepositoryPort {
      private snapshots: Snapshot[] = [];
      save(snapshot: Snapshot): Promise<void> {
        this.snapshots.push(snapshot);
        return Promise.resolve();
      }
      getLatest(): Promise<Snapshot | null> {
        return Promise.resolve(this.snapshots.at(-1) ?? null);
      }
      getById(id: SnapshotId): Promise<Snapshot | null> {
        return Promise.resolve(this.snapshots.find((s) => s.id === id) ?? null);
      }
      list(): Promise<readonly SnapshotSummary[]> {
        return Promise.resolve([]); // always empty, regardless of what was saved
      }
    }
    const violations = await checkSnapshotRepositoryConformance(new BrokenList());
    expect(violations).toContainEqual(expect.objectContaining({ rule: 'list-includes-every-saved-snapshot' }));
  });

  it('flags a repository whose list() filter is not respected', async () => {
    class BrokenFilter implements SnapshotRepositoryPort {
      private snapshots: Snapshot[] = [];
      save(snapshot: Snapshot): Promise<void> {
        this.snapshots.push(snapshot);
        return Promise.resolve();
      }
      getLatest(): Promise<Snapshot | null> {
        return Promise.resolve(
          this.snapshots.reduce<Snapshot | null>(
            (latest, candidate) => (!latest || candidate.createdAt > latest.createdAt ? candidate : latest),
            null,
          ),
        );
      }
      getById(id: SnapshotId): Promise<Snapshot | null> {
        return Promise.resolve(this.snapshots.find((s) => s.id === id) ?? null);
      }
      list(_filter?: SnapshotFilter): Promise<readonly SnapshotSummary[]> {
        // Ignores the filter entirely — always returns everything.
        return Promise.resolve(this.snapshots.map((s) => ({ id: s.id, createdAt: s.createdAt })));
      }
    }
    const violations = await checkSnapshotRepositoryConformance(new BrokenFilter());
    expect(violations.some((v) => v.rule.startsWith('list-before-filter') || v.rule.startsWith('list-after-filter'))).toBe(
      true,
    );
  });
});
