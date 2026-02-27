import { describe, it, expect } from 'vitest';
import { isAdminEmail, isPrimaryAdmin, PRIMARY_ADMIN_EMAIL } from '../../lib/db/config';

describe('Admin Config', () => {
  it('should identify primary admin email', () => {
    expect(isAdminEmail('jairosouza67@gmail.com')).toBe(true);
    expect(isPrimaryAdmin('jairosouza67@gmail.com')).toBe(true);
  });

  it('should be case-insensitive for isAdminEmail', () => {
    // isAdminEmail lowercases the input before checking
    expect(isAdminEmail('JAIROSOUZA67@GMAIL.COM')).toBe(true);
    // isPrimaryAdmin also lowercases
    expect(isPrimaryAdmin('JAIROSOUZA67@GMAIL.COM')).toBe(true);
  });

  it('should reject non-admin emails', () => {
    expect(isAdminEmail('student@test.com')).toBe(false);
    expect(isPrimaryAdmin('student@test.com')).toBe(false);
  });

  it('should have primary admin constant', () => {
    expect(PRIMARY_ADMIN_EMAIL).toBe('jairosouza67@gmail.com');
  });
});
