import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SummaryService } from './summaryService';

describe('SummaryService', () => {
  let summaryService: SummaryService;
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Setup mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn()
    };

    summaryService = new SummaryService(mockSupabase);
  });

  describe('getSummary', () => {
    it('should return summary when found', async () => {
      // Arrange
      const mockSummary = { id: 'summary-1', summary_markdown: 'Test summary' };
      mockSupabase.single.mockResolvedValue({ data: mockSummary, error: null });

      // Act
      const result = await summaryService.getSummary('summary-1');

      // Assert
      expect(result).toEqual(mockSummary);
      expect(mockSupabase.from).toHaveBeenCalledWith('summaries');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'summary-1');
    });

    it('should return null when summary not found', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      // Act
      const result = await summaryService.getSummary('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      // Arrange
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      // Act & Assert
      await expect(summaryService.getSummary('summary-1'))
        .rejects.toThrow('Failed to fetch summary: Database error');
    });
  });

  describe('listSummaries', () => {
    it('should return paginated summaries', async () => {
      // Arrange
      const mockSummaries = [
        { id: 'summary-1', created_at: '2023-01-02T00:00:00Z' },
        { id: 'summary-2', created_at: '2023-01-01T00:00:00Z' }
      ];
      mockSupabase.limit.mockResolvedValue({ data: mockSummaries, error: null });

      // Act
      const result = await summaryService.listSummaries({ limit: 2 });

      // Assert
      expect(result).toEqual({
        items: mockSummaries,
        nextCursor: '2023-01-01T00:00:00Z'
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('summaries');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.limit).toHaveBeenCalledWith(2);
    });

    it('should apply cursor when provided', async () => {
      // Arrange
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      // Act
      await summaryService.listSummaries({ 
        limit: 10, 
        cursor: '2023-01-01T00:00:00Z' 
      });

      // Assert
      expect(mockSupabase.lt).toHaveBeenCalledWith('created_at', '2023-01-01T00:00:00Z');
    });
  });

  // Additional tests for other methods would follow the same pattern
});
