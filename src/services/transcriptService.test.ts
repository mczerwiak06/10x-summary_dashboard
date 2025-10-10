import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranscriptService } from './transcriptService';
import { QuotaExceededError } from '../utils/errors';

// Mock Supabase client
const createMockSupabaseClient = (options = {}) => {
  const defaults = {
    quotaCount: 10,
    quotaError: null,
    insertError: null,
    insertId: 'test-uuid',
  };

  const config = { ...defaults, ...options };

  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: config.insertId },
            error: config.insertError
          })
        }),
        count: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            head: vi.fn().mockResolvedValue({
              count: config.quotaCount,
              error: config.quotaError
            })
          })
        })
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: config.insertId },
            error: config.insertError
          })
        })
      })
    })
  };
};

describe('TranscriptService', () => {
  let mockSupabase;
  let transcriptService;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    transcriptService = new TranscriptService(mockSupabase);
  });

  describe('ensureQuota', () => {
    it('should not throw error when user is under quota', async () => {
      mockSupabase = createMockSupabaseClient({ quotaCount: 19 });
      transcriptService = new TranscriptService(mockSupabase);

      await expect(transcriptService.ensureQuota('user-123')).resolves.not.toThrow();
    });

    it('should throw QuotaExceededError when user is at quota limit', async () => {
      mockSupabase = createMockSupabaseClient({ quotaCount: 20 });
      transcriptService = new TranscriptService(mockSupabase);

      await expect(transcriptService.ensureQuota('user-123')).rejects.toThrow(QuotaExceededError);
    });

    it('should throw QuotaExceededError when user is over quota', async () => {
      mockSupabase = createMockSupabaseClient({ quotaCount: 25 });
      transcriptService = new TranscriptService(mockSupabase);

      await expect(transcriptService.ensureQuota('user-123')).rejects.toThrow(QuotaExceededError);
    });

    it('should throw Error when database query fails', async () => {
      mockSupabase = createMockSupabaseClient({ 
        quotaError: new Error('Database error') 
      });
      transcriptService = new TranscriptService(mockSupabase);

      await expect(transcriptService.ensureQuota('user-123')).rejects.toThrow('Failed to check transcript quota');
    });
  });

  describe('createTranscript', () => {
    it('should create transcript and return ID', async () => {
      const expectedId = 'new-transcript-id';
      mockSupabase = createMockSupabaseClient({ 
        quotaCount: 5,
        insertId: expectedId 
      });
      transcriptService = new TranscriptService(mockSupabase);

      const result = await transcriptService.createTranscript('user-123', 'Sample transcript text');
      expect(result).toBe(expectedId);
    });

    it('should throw error when insert fails', async () => {
      mockSupabase = createMockSupabaseClient({ 
        insertError: new Error('Insert failed') 
      });
      transcriptService = new TranscriptService(mockSupabase);

      await expect(transcriptService.createTranscript('user-123', 'Sample text')).rejects.toThrow('Unable to save transcript');
    });

    it('should check quota before inserting', async () => {
      const ensureQuotaSpy = vi.spyOn(TranscriptService.prototype, 'ensureQuota');
      
      await transcriptService.createTranscript('user-123', 'Sample text');
      
      expect(ensureQuotaSpy).toHaveBeenCalledWith('user-123');
      ensureQuotaSpy.mockRestore();
    });
  });
});
