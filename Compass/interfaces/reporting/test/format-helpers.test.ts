import { describe, expect, it } from 'vitest';
import { versionRange } from '@compass/domain';
import { buildComponent } from '@compass/testing';
import {
  componentName,
  escapeHtml,
  formatConstraint,
  riskEmoji,
  riskLabel,
  statusEmoji,
  statusLabel,
} from '../src/format-helpers.js';

describe('statusEmoji / statusLabel', () => {
  it('covers every CompatibilityStatus', () => {
    expect(statusEmoji('compatible')).toBe('✅');
    expect(statusEmoji('incompatible')).toBe('❌');
    expect(statusEmoji('unverified')).toBe('❓');
    expect(statusLabel('compatible')).toBe('Compatible');
    expect(statusLabel('incompatible')).toBe('Incompatible');
    expect(statusLabel('unverified')).toBe('Unverified');
  });
});

describe('riskEmoji / riskLabel', () => {
  it('covers every RiskLevel', () => {
    expect(riskEmoji('low')).toBe('🟢');
    expect(riskEmoji('medium')).toBe('🟡');
    expect(riskEmoji('high')).toBe('🔴');
    expect(riskLabel('low')).toBe('Low');
    expect(riskLabel('medium')).toBe('Medium');
    expect(riskLabel('high')).toBe('High');
  });
});

describe('componentName', () => {
  it('returns the display name for a known component', () => {
    const component = buildComponent({ name: 'midnight-js' });
    expect(componentName([component], component.id)).toBe('midnight-js');
  });

  it('falls back to the raw id when the component is not in the given set', () => {
    const component = buildComponent();
    expect(componentName([], component.id)).toBe(component.id);
  });
});

describe('formatConstraint', () => {
  it('renders a version-range constraint as its raw range', () => {
    expect(formatConstraint(versionRange('>=1.0.0'))).toBe('>=1.0.0');
  });

  it('renders a capability constraint with a range', () => {
    expect(formatConstraint({ kind: 'capability', name: 'compact-language', range: '>=0.20' })).toBe(
      'capability compact-language >=0.20',
    );
  });

  it('renders a capability constraint with no range', () => {
    expect(formatConstraint({ kind: 'capability', name: 'prerelease', range: null })).toBe('capability prerelease');
  });

  it('renders "and" and "or" composites', () => {
    expect(formatConstraint({ kind: 'and', constraints: [versionRange('>=1.0.0'), versionRange('<2.0.0')] })).toBe(
      '>=1.0.0 AND <2.0.0',
    );
    expect(formatConstraint({ kind: 'or', constraints: [versionRange('>=1.0.0'), versionRange('>=2.0.0')] })).toBe(
      '>=1.0.0 OR >=2.0.0',
    );
  });

  it('renders a "not" constraint', () => {
    expect(formatConstraint({ kind: 'not', constraint: versionRange('>=2.0.0') })).toBe('NOT (>=2.0.0)');
  });
});

describe('escapeHtml', () => {
  it('escapes every reserved character', () => {
    expect(escapeHtml(`<script>alert("x & 'y'")</script>`)).toBe(
      '&lt;script&gt;alert(&quot;x &amp; &#39;y&#39;&quot;)&lt;/script&gt;',
    );
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeHtml('midnight-js')).toBe('midnight-js');
  });
});
