/**
 * Small, shared formatting primitives every renderer in this package uses.
 * Nothing here computes a compatibility conclusion — it only turns
 * already-computed domain data into readable text. Business logic stays in
 * core/domain and core/application; this package exists so the CLI, the
 * GitHub Action, and the dashboard render that logic's output identically
 * instead of each inventing their own formatting.
 */
import type { Component, ComponentId, CompatibilityStatus, Constraint, RiskLevel } from '@compass/domain';

export function statusEmoji(status: CompatibilityStatus): string {
  switch (status) {
    case 'compatible':
      return '✅';
    case 'incompatible':
      return '❌';
    case 'unverified':
      return '❓';
  }
}

export function statusLabel(status: CompatibilityStatus): string {
  switch (status) {
    case 'compatible':
      return 'Compatible';
    case 'incompatible':
      return 'Incompatible';
    case 'unverified':
      return 'Unverified';
  }
}

export function riskEmoji(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'high':
      return '🔴';
  }
}

export function riskLabel(level: RiskLevel): string {
  switch (level) {
    case 'low':
      return 'Low';
    case 'medium':
      return 'Medium';
    case 'high':
      return 'High';
  }
}

/** Every renderer in this package looks up a display name the same way — falls back to the raw id if a component isn't in the given set. */
export function componentName(components: readonly Component[], id: ComponentId): string {
  return components.find((component) => component.id === id)?.name ?? id;
}

/** Renders a Constraint back to the kind of range/expression text a human declared it as. */
export function formatConstraint(constraint: Constraint): string {
  switch (constraint.kind) {
    case 'version-range':
      return constraint.range;
    case 'capability':
      return constraint.range ? `capability ${constraint.name} ${constraint.range}` : `capability ${constraint.name}`;
    case 'and':
      return constraint.constraints.map(formatConstraint).join(' AND ');
    case 'or':
      return constraint.constraints.map(formatConstraint).join(' OR ');
    case 'not':
      return `NOT (${formatConstraint(constraint.constraint)})`;
  }
}

/** HTML-escapes text pulled from ecosystem data (component names, descriptions) before embedding it in a generated page. */
export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
