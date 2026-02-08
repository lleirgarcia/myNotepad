import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
  });

  it('handles tailwind merge (later overrides)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles empty and undefined', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
  });
});
