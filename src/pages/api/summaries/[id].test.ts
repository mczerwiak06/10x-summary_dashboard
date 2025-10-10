import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './[id]';
import { SummaryService } from '../../../services/summaryService';

// Mock the SummaryService
vi.mock('../../../services/summaryService', () => {
  return {
    SummaryService: vi.fn().mockImplementation(() => ({
      getSummary: vi.fn()
    }))
  };
});

describe('GET /api/summaries/:id', () => {
  let mockParams: Record<string, string>;
  let mockLocals: Record<string, any>;
  let mockSummaryService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock params
    mockParams = {
      id: '123e4567-e89b-12d3-a456-426614174000'
    };

    // Setup mock Supabase client
    mockLocals = {
      supabase: {}
    };

    // Get reference to mocked service
    mockSummaryService = SummaryService.mock.instances[0];
  });

  it('should return 200 with summary data when found', async () => {
    // Arrange
    const mockSummary = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      summary_markdown: 'Test summary content',
      transcript_id: 'transcript-123',
      created_at: '2023-01-01T12:00:00Z',
      updated_at: '2023-01-01T12:30:00Z',
      user_id: 'user-123'
    };

    mockSummaryService.getSummary.mockResolvedValue(mockSummary);

    // Act
    const response = await GET({ 
      params: mockParams, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      id: mockSummary.id,
      summaryMarkdown: mockSummary.summary_markdown,
      transcriptId: mockSummary.transcript_id,
      createdAt: mockSummary.created_at,
      updatedAt: mockSummary.updated_at
    });
    expect(mockSummaryService.getSummary).toHaveBeenCalledWith(mockParams.id);
  });

  it('should return 404 when summary is not found', async () => {
    // Arrange
    mockSummaryService.getSummary.mockResolvedValue(null);

    // Act
    const response = await GET({ 
      params: mockParams, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(responseBody).toEqual({
      error: 'Summary not found'
    });
  });

  it('should return 400 when ID is not a valid UUID', async () => {
    // Arrange
    mockParams.id = 'not-a-uuid';

    // Act
    const response = await GET({ 
      params: mockParams, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      error: 'Invalid summary ID format'
    });
  });
});
