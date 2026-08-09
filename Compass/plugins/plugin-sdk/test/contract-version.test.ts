import { describe, expect, it } from 'vitest';
import { assertContractVersionSupported, PLUGIN_SDK_CONTRACT_VERSION, UnsupportedContractVersionError } from '../src/contract-version.js';

describe('assertContractVersionSupported', () => {
  it('accepts a plugin declaring the exact current contract version', () => {
    expect(() =>
      { assertContractVersionSupported({ name: 'test-plugin', contractVersion: PLUGIN_SDK_CONTRACT_VERSION }); },
    ).not.toThrow();
  });

  it('accepts a plugin declaring a different minor/patch version within the same major', () => {
    expect(() => { assertContractVersionSupported({ name: 'test-plugin', contractVersion: '1.9.9' }); }).not.toThrow();
  });

  it('rejects a plugin declaring a different major version', () => {
    expect(() => { assertContractVersionSupported({ name: 'test-plugin', contractVersion: '2.0.0' }); }).toThrow(
      UnsupportedContractVersionError,
    );
  });

  it('includes the plugin name and both versions in the error message', () => {
    expect(() => { assertContractVersionSupported({ name: 'test-plugin', contractVersion: '2.0.0' }); }).toThrow(
      /test-plugin.*2\.0\.0.*1\.0\.0/s,
    );
  });

  it('rejects a malformed contract version string', () => {
    expect(() => { assertContractVersionSupported({ name: 'test-plugin', contractVersion: 'not-a-version' }); }).toThrow(
      TypeError,
    );
  });
});
