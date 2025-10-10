import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './index';
import { SummaryService } from '../../../services/summaryService';

// Mock the SummaryService
vi.mock('../../../services/summaryService', () => {
  return {
    SummaryService: vi.fn().mockImplementation(() => ({
      listSummaries: vi.fn()
    }))
  };
});

describe('GET /api/summaries', () => {
  let mockRequest: Request;
  let mockLocals: Record<string, any>;
  let mockSummaryService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request
    mockRequest = new Request('https://example.com/api/summaries?limit=10');

    // Setup mock Supabase client
    mockLocals = {
      supabase: {}
    };

    // Get reference to mocked service
    mockSummaryService = SummaryService.mock.instances[0];
  });

  it('should return 200 with paginated summaries', async () => {
    // Arrange
    const mockSummaries = [
      {
        id: 'summary-1',
        summary_markdown: 'Test summary 1',
        transcript_id: 'transcript-1',
        created_at: '2023-01-01T12:00:00Z',
        updated_at: '2023-01-01T12:00:00Z',
        user_id: 'user-123'
      },
      {
        id: 'summary-2',
        summary_markdown: 'Test summary 2',
        transcript_id: 'transcript-2',
        created_at: '2023-01-01T11:00:00Z',
        updated_at: '2023-01-01T11:00:00Z',
        user_id: 'user-456'
      }
    ];

    mockSummaryService.listSummaries.mockResolvedValue({
      items: mockSummaries,
      nextCursor: '2023-01-01T11:00:00Z'
    });

    // Act
    const response = await GET({ 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      items: [
        {
          id: 'summary-1',
          summaryMarkdown: 'Test summary 1',
          transcriptId: 'transcript-1',
          createdAt: '2023-01-01T12:00:00Z',
          updatedAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'summary-2',
          summaryMarkdown: 'Test summary 2',
          transcriptId: 'transcript-2',
          createdAt: '2023-01-01T11:00:00Z',
          updatedAt: '2023-01-01T11:00:00Z'
        }
      ],
      nextCursor: '2023-01-01T11:00:00Z'
    });
    expect(mockSummaryService.listSummaries).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 })
    );
  });

  it('should return 400 when pagination parameters are invalid', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/summaries?cursor=invalid-date');

    // Act
    const response = await GET({ 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseBody.error).toContain('Invalid cursor format');
  });
});
