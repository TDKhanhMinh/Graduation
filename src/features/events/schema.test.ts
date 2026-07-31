import { describe, it, expect } from 'vitest';
import { normalizeSlug, eventSchema } from './schema';

describe('Event Schema', () => {
  describe('normalizeSlug', () => {
    it('should convert to lowercase', () => {
      expect(normalizeSlug('HELLO')).toBe('hello');
    });

    it('should replace spaces and underscores with hyphens', () => {
      expect(normalizeSlug('hello world_test')).toBe('hello-world-test');
    });

    it('should remove special characters', () => {
      expect(normalizeSlug('hello@world!#test')).toBe('helloworldtest');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(normalizeSlug('-hello-world-')).toBe('hello-world');
    });

    it('should handle complex mixed cases', () => {
      expect(normalizeSlug('  Héllo Wörld_123!  ')).toBe('hllo-wrld-123'); // Héllo Wörld becomes hllo-wrld because é/ö are stripped by \w (only ascii word chars)
    });
  });

  describe('eventSchema', () => {
    it('should validate correct data', () => {
      const data = {
        title: 'Lễ Trưởng Thành',
        slug: 'le-truong-thanh',
        visibility: 'unlisted',
        submission_mode: 'open',
      };
      
      const result = eventSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail if slug contains invalid characters', () => {
      const data = {
        title: 'Test Event',
        slug: 'invalid_slug@',
      };
      
      const result = eventSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.slug).toBeDefined();
      }
    });

    it('should fail if title is too short', () => {
      const data = {
        title: 'A',
        slug: 'test',
      };
      
      const result = eventSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept the database-backed approval_required submission mode', () => {
      const result = eventSchema.safeParse({
        title: 'Test Event',
        slug: 'test-event',
        submission_mode: 'approval_required',
      });

      expect(result.success).toBe(true);
    });

    it('should reject the legacy approval submission mode alias', () => {
      const result = eventSchema.safeParse({
        title: 'Test Event',
        slug: 'test-event',
        submission_mode: 'approval',
      });

      expect(result.success).toBe(false);
    });
  });
});
