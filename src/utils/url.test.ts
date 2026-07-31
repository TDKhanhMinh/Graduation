import { describe, it, expect } from 'vitest';
import { getSafeNextPath } from './url';

describe('getSafeNextPath', () => {
  it('should return / if value is null', () => {
    expect(getSafeNextPath(null)).toBe('/');
  });

  it('should return / if value does not start with /', () => {
    expect(getSafeNextPath('https://evil.com/redirect')).toBe('/');
    expect(getSafeNextPath('dashboard')).toBe('/');
  });

  it('should return / if value starts with // (open redirect attempt)', () => {
    expect(getSafeNextPath('//evil.com/test')).toBe('/');
  });

  it('should return the path if it is a valid absolute local path', () => {
    expect(getSafeNextPath('/dashboard/events')).toBe('/dashboard/events');
    expect(getSafeNextPath('/auth/login?test=1')).toBe('/auth/login?test=1');
  });
});
