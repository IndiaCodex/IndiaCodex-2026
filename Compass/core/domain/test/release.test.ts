import { describe, expect, it } from 'vitest';
import { providedCapabilities, requiredCapabilities } from '../src/release.js';
import { capability, release } from './fixtures.js';

describe('providedCapabilities / requiredCapabilities', () => {
  it('splits a release capability list by direction', () => {
    const r = release({
      id: 'r1',
      componentId: 'sdk-a',
      version: '1.0.0',
      capabilities: [capability('provided-one', '1.0.0', 'provided'), capability('required-one', '1.0.0', 'required')],
    });

    expect(providedCapabilities(r).map((c) => c.name)).toEqual(['provided-one']);
    expect(requiredCapabilities(r).map((c) => c.name)).toEqual(['required-one']);
  });
});
