#!/usr/bin/env node
/**
 * The offline demo: ingests the real Midnight ecosystem fixture (recorded
 * once from the real `midnightntwrk` GitHub organization — see
 * plugins/midnight/test/fixtures/midnight-ecosystem.fixture.json) through
 * the exact same pipeline `forge-midnight analyze` runs against live data,
 * and writes the same reports the CLI, GitHub Action, and dashboard
 * produce. Zero network calls, zero GitHub API rate limit, works anywhere,
 * every time — see docs/demo.md.
 *
 * Requires `npm run build` to have run first (imports built dist/ output,
 * not source, to avoid needing a TypeScript loader for a demo script).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = join(ROOT, 'demo-output');

const bold = (text) => `\x1b[1m${text}\x1b[0m`;
const dim = (text) => `\x1b[2m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

let modules;
try {
  modules = await Promise.all([
    import(join(ROOT, 'core/application/dist/index.js')),
    import(join(ROOT, 'core/domain/dist/index.js')),
    import(join(ROOT, 'core/testing/dist/index.js')),
    import(join(ROOT, 'plugins/midnight/dist/index.js')),
    import(join(ROOT, 'interfaces/reporting/dist/index.js')),
  ]);
} catch {
  console.error(red('The demo needs a built workspace first.'));
  console.error(`Run: ${bold('npm install && npm run build')}, then ${bold('npm run demo')} again.`);
  process.exit(2);
}

const [application, domain, testing, midnight, reporting] = modules;
const { IngestSnapshotUseCase } = application;
const { semVerScheme, toTimestamp, buildCompatibilityMatrixView } = domain;
const { FixedClock, InMemorySnapshotRepository, SequentialIdGenerator } = testing;
const { MidnightSourceAdapter, NpmManifestCapabilityExtractor, CompactToolchainCapabilityExtractor, MidnightRulePack } = midnight;
const { renderDashboardHtml, renderCompatibilityMatrixMarkdown, renderDependencyGraphMermaid, renderPrComment } = reporting;

/**
 * A GitHubClient backed by the real, recorded fixture instead of live
 * network calls — the same replay strategy plugins/midnight's own test
 * suite uses (test/fixture-github-client.ts), reimplemented here so this
 * script has no dependency on that package's test-only exports.
 */
class FixtureGitHubClient {
  constructor(fixture) {
    this.fixture = fixture;
  }
  async getRepository(owner, repo) {
    const info = this.fixture.repositories[`${owner}/${repo}`];
    if (!info) throw new Error(`No fixture repository recorded for ${owner}/${repo}`);
    return info;
  }
  async listReleases(owner, repo) {
    return this.fixture.releases[`${owner}/${repo}`] ?? [];
  }
  async getDefaultBranchHeadCommit(owner, repo, branch) {
    const commit = this.fixture.headCommits[`${owner}/${repo}@${branch}`];
    if (!commit) throw new Error(`No fixture head commit recorded for ${owner}/${repo}@${branch}`);
    return commit;
  }
  async getFileContent(owner, repo, path, ref) {
    return this.fixture.fileContents[`${owner}/${repo}@${ref}:${path}`] ?? null;
  }
}

/** A column-aligned console rendering of the same matrix cells `renderCompatibilityMatrixMarkdown` writes to file — Markdown pipes read poorly in a terminal. */
function printMatrixTable(matrix, components) {
  const name = (id) => components.find((component) => component.id === id)?.name ?? id;
  const rows = [...matrix.cells]
    .sort((a, b) => `${name(a.componentAId)}->${name(a.componentBId)}`.localeCompare(`${name(b.componentAId)}->${name(b.componentBId)}`))
    .map((cell) => ({
      from: name(cell.componentAId),
      to: name(cell.componentBId),
      status: cell.status,
      relationships: String(cell.relationshipIds.length),
    }));

  if (rows.length === 0) {
    console.log(dim('  (no known compatibility relationships)'));
    return;
  }

  const colorForStatus = (status) => (status === 'incompatible' ? red : status === 'compatible' ? green : yellow);
  const labelForStatus = (status) => (status === 'incompatible' ? '❌ Incompatible' : status === 'compatible' ? '✅ Compatible' : '❓ Unverified');

  const fromWidth = Math.max(...rows.map((row) => row.from.length), 'Component'.length);
  const toWidth = Math.max(...rows.map((row) => row.to.length), 'Depends on'.length);

  console.log(`  ${'Component'.padEnd(fromWidth)}   ${'Depends on'.padEnd(toWidth)}   Status`);
  for (const row of rows) {
    const paint = colorForStatus(row.status);
    console.log(`  ${row.from.padEnd(fromWidth)}   ${row.to.padEnd(toWidth)}   ${paint(labelForStatus(row.status))}  ${dim(`(${row.relationships} relationship(s))`)}`);
  }
}

console.log(bold(cyan('\n🧭  Midnight Compass — Offline Demo\n')));
console.log(dim('Ingesting the real, recorded midnightntwrk ecosystem fixture. No network calls.\n'));

const fixturePath = join(ROOT, 'plugins/midnight/test/fixtures/midnight-ecosystem.fixture.json');
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
const client = new FixtureGitHubClient(fixture);

const useCase = new IngestSnapshotUseCase({
  sourceAdapters: [new MidnightSourceAdapter(client)],
  capabilityExtractors: [new NpmManifestCapabilityExtractor(client), new CompactToolchainCapabilityExtractor(client)],
  rulePacks: [new MidnightRulePack()],
  snapshotRepository: new InMemorySnapshotRepository(),
  clock: new FixedClock(toTimestamp(new Date().toISOString())),
  idGenerator: new SequentialIdGenerator(),
  versionScheme: semVerScheme,
});

const snapshot = await useCase.execute();
const matrix = buildCompatibilityMatrixView(snapshot.compatibilityRelationships, snapshot.releases);
const incompatibleCells = matrix.cells.filter((cell) => cell.status === 'incompatible');

console.log(`${green('✓')} Ingested ${bold(String(snapshot.components.length))} components, ${bold(String(snapshot.releases.length))} releases, ${bold(String(snapshot.compatibilityRelationships.length))} evaluated relationships.\n`);

console.log(bold('Compatibility Matrix'));
printMatrixTable(matrix, snapshot.components);
console.log();

if (incompatibleCells.length > 0) {
  console.log(bold(yellow(`⚠ ${incompatibleCells.length} real incompatibilit${incompatibleCells.length === 1 ? 'y' : 'ies'} found — recorded from the actual midnightntwrk GitHub organization:`)));
  for (const cell of incompatibleCells) {
    const from = snapshot.components.find((c) => c.id === cell.componentAId)?.name ?? cell.componentAId;
    const to = snapshot.components.find((c) => c.id === cell.componentBId)?.name ?? cell.componentBId;
    console.log(`  ${red('✗')} ${bold(from)} → ${to}`);
  }
  console.log();
}

console.log(bold('Ecosystem Risk'));
for (const risk of snapshot.risks) {
  const scope = risk.scope.kind === 'component' ? risk.scope.componentId : risk.scope.kind;
  const label = risk.level === 'high' ? red('🔴 High') : risk.level === 'medium' ? yellow('🟡 Medium') : green('🟢 Low');
  console.log(`  ${label}  ${scope}  ${dim(`(${risk.contributingFactors.length} contributing factor(s))`)}`);
}
console.log();

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'matrix.md'), renderCompatibilityMatrixMarkdown(matrix, snapshot.components), 'utf8');
writeFileSync(join(OUT_DIR, 'graph.mmd'), renderDependencyGraphMermaid(snapshot), 'utf8');
writeFileSync(
  join(OUT_DIR, 'dashboard.html'),
  renderDashboardHtml({ snapshot, matrix, risks: snapshot.risks, generatedAt: snapshot.createdAt }),
  'utf8',
);
writeFileSync(
  join(OUT_DIR, 'pr-comment.md'),
  renderPrComment({ components: snapshot.components, matrix, risks: snapshot.risks, generatedAt: snapshot.createdAt }).markdown,
  'utf8',
);

console.log(dim(`Wrote matrix.md, graph.mmd, dashboard.html, pr-comment.md → ${join('demo-output')}/`));
console.log(dim(`Open ${join('demo-output', 'dashboard.html')} in a browser to see the full dashboard.\n`));
