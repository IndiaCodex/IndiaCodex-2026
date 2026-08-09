/**
 * The lightweight dashboard: a single, self-contained, static HTML file —
 * no client-side JavaScript, no external requests, no bundler. Opens
 * directly in a browser from disk. Built entirely from the same
 * `CompatibilityMatrix`, `Risk[]`, and `Snapshot` shapes the CLI and GitHub
 * Action already render — this file adds presentation, not analysis.
 *
 * Deliberately not a live server with its own API: docs/architecture/
 * roadmap.md sequences a hosted dashboard behind the CLI and Action
 * precisely because its value is derivative of the engine underneath it
 * being trustworthy, not because it needs its own backend to exist at all.
 * A future hosted version would swap this renderer's inputs for live API
 * responses without changing a single function in this package.
 */
import { renderCompatibilityMatrixHtml } from './matrix-report.js';
import { renderDependencyGraphText } from './dependency-graph.js';
import { componentName, escapeHtml, riskEmoji, riskLabel } from './format-helpers.js';
import type { CompatibilityMatrix, Risk, Snapshot } from '@compass/domain';

export interface DashboardInput {
  readonly snapshot: Snapshot;
  readonly matrix: CompatibilityMatrix;
  readonly risks: readonly Risk[];
  readonly generatedAt: string;
}

const STYLE = `
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 960px; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.15rem; margin-top: 2.5rem; border-bottom: 1px solid #8884; padding-bottom: 0.35rem; }
  .meta { color: #888; font-size: 0.9rem; }
  table { width: 100%; border-collapse: collapse; margin-top: 0.75rem; }
  th, td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #8883; font-size: 0.92rem; }
  th { font-weight: 600; }
  tr.status-incompatible { background: #ff000012; }
  tr.status-unverified { background: #ffcc0012; }
  .cards { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; }
  .card { border: 1px solid #8883; border-radius: 8px; padding: 0.75rem 1rem; min-width: 180px; }
  .card .level { font-size: 1.1rem; font-weight: 600; }
  pre { background: #8881; padding: 0.75rem; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; }
  .empty { color: #888; font-style: italic; }
`;

function renderRiskCards(risks: readonly Risk[], snapshot: Snapshot): string {
  if (risks.length === 0) return '<p class="empty">No risk data yet — nothing has a relationship or breaking change to assess.</p>';

  const cards = risks
    .map((risk) => {
      const label = risk.scope.kind === 'component' ? componentName(snapshot.components, risk.scope.componentId) : risk.scope.kind;
      return (
        '<div class="card">' +
        `<div>${escapeHtml(label)}</div>` +
        `<div class="level">${riskEmoji(risk.level)} ${riskLabel(risk.level)}</div>` +
        `<div class="meta">${risk.contributingFactors.length} contributing factor(s)</div>` +
        '</div>'
      );
    })
    .join('\n');

  return `<div class="cards">\n${cards}\n</div>`;
}

export function renderDashboardHtml(input: DashboardInput): string {
  const title = 'Compass — Ecosystem Dashboard';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
<h1>🧭 ${escapeHtml(title)}</h1>
<p class="meta">Snapshot <code>${escapeHtml(input.snapshot.id)}</code> — generated ${escapeHtml(input.generatedAt)}</p>

<h2>Ecosystem Health</h2>
${renderRiskCards(input.risks, input.snapshot)}

<h2>Compatibility Matrix</h2>
${renderCompatibilityMatrixHtml(input.matrix, input.snapshot.components)}

<h2>Dependency Relationships</h2>
<pre>${escapeHtml(renderDependencyGraphText(input.snapshot))}</pre>

<h2>Components Tracked</h2>
<table>
<thead><tr><th>Component</th><th>Type</th><th>Releases</th></tr></thead>
<tbody>
${input.snapshot.components
  .map((component) => {
    const releaseCount = input.snapshot.releases.filter((release) => release.componentId === component.id).length;
    return `<tr><td>${escapeHtml(component.name)}</td><td>${escapeHtml(component.type)}</td><td>${releaseCount}</td></tr>`;
  })
  .join('\n')}
</tbody>
</table>

</body>
</html>
`;
}
