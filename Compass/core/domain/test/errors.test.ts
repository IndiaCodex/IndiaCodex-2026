import { describe, expect, it } from 'vitest';
import { DomainError, NotFoundError } from '../src/errors.js';

describe('NotFoundError', () => {
  it('names the kind and id in its message and is a DomainError', () => {
    const error = new NotFoundError('Component', 'sdk-a');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toContain('Component');
    expect(error.message).toContain('sdk-a');
    expect(error.name).toBe('NotFoundError');
  });
});
