import { describe, it, expect } from 'vitest';
import { CreateTranscriptSchema } from './transcript.schema';

describe('CreateTranscriptSchema', () => {
  it('should validate valid transcript text', () => {
    const validData = {
      transcriptText: 'This is a valid transcript text'
    };
    
    const result = CreateTranscriptSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject empty transcript text', () => {
    const invalidData = {
      transcriptText: ''
    };
    
    const result = CreateTranscriptSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be empty');
    }
  });

  it('should reject transcript text exceeding 1000 words', () => {
    // Generate a string with 1001 words
    const longText = Array(1001).fill('word').join(' ');
    
    const invalidData = {
      transcriptText: longText
    };
    
    const result = CreateTranscriptSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('1000-word limit');
    }
  });

  it('should accept transcript text with exactly 1000 words', () => {
    // Generate a string with 1000 words
    const text = Array(1000).fill('word').join(' ');
    
    const validData = {
      transcriptText: text
    };
    
    const result = CreateTranscriptSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject missing transcript text', () => {
    const invalidData = {};
    
    const result = CreateTranscriptSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('required');
    }
  });
});
