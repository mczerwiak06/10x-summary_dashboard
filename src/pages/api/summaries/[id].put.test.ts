import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from './[id].put';
import { SummaryService } from '../../../services/summaryService';
import { AnalyticsService } from '../../../services/analyticsService';

// Mock the services
vi.mock('../../../services/summaryService', () => {
  return {
    SummaryService: vi.fn().mockImplementation(() => ({
      updateSummary: vi.fn()
    }))
  };
});

vi.mock('../../../services/analyticsService', () => {
  return {
    AnalyticsService: vi.fn().mockImplementation(() => ({
      trackEvent: vi.fn()
    }))
  };
});

describe('PUT /api/summaries/:id', () => {
  let mockRequest: Request;
  let mockParams: Record<string, string>;
  let mockLocals: Record<string, any>;
  let mockSummaryService: any;
  let mockAnalyticsService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request with auth header
    mockRequest = new Request('https://example.com/api/summaries/123', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summaryMarkdown: 'Updated summary content'
      })
    });

    // Setup mock params
    mockParams = {
      id: '123e4567-e89b-12d3-a456-426614174000'
    };

    // Setup mock Supabase client
    mockLocals = {
      supabase: {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null
          })
        }
      }
    };

    // Get reference to mocked services
    mockSummaryService = SummaryService.mock.instances[0];
    mockAnalyticsService = AnalyticsService.mock.instances[0];
  });

  it('should return 200 with updated summary when successful', async () => {
    // Arrange
    const mockUpdatedSummary = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      summary_markdown: 'Updated summary content',
      transcript_id: 'transcript-123',
      created_at: '2023-01-01T12:00:00Z',
      updated_at: '2023-01-01T13:00:00Z',
      user_id: 'user-123'
    };

    mockSummaryService.updateSummary.mockResolvedValue(mockUpdatedSummary);
    mockAnalyticsService.trackEvent.mockResolvedValue(undefined);

    // Act
    const response = await PUT({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      id: mockUpdatedSummary.id,
      summaryMarkdown: mockUpdatedSummary.summary_markdown,
      transcriptId: mockUpdatedSummary.transcript_id,
      createdAt: mockUpdatedSummary.created_at,
      updatedAt: mockUpdatedSummary.updated_at
    });
    expect(mockSummaryService.updateSummary).toHaveBeenCalledWith(
      mockParams.id,
      'user-123',
      'Updated summary content'
    );
    expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith(
      'summary_accepted',
      'user-123',
      { summaryId: mockUpdatedSummary.id }
    );
  });

  it('should return 404 when summary is not found', async () => {
    // Arrange
    mockSummaryService.updateSummary.mockResolvedValue(null);

    // Act
    const response = await PUT({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(responseBody).toEqual({
      error: 'Summary not found'
    });
    expect(mockAnalyticsService.trackEvent).not.toHaveBeenCalled();
  });

  it('should return 400 when ID is not a valid UUID', async () => {
    // Arrange
    mockParams.id = 'not-a-uuid';

    // Act
    const response = await PUT({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      error: 'Invalid summary ID format'
    });
  });

  it('should return 400 when request body is invalid', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/summaries/123', {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer valid-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Missing summaryMarkdown
      })
    });

    // Act
    const response = await PUT({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseBody.error).toContain('summaryMarkdown is required');
  });

  it('should return 401 when auth header is missing', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/summaries/123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summaryMarkdown: 'Updated summary content'
      })
    });

    // Act
    const response = await PUT({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(responseBody).toEqual({
      error: 'Unauthenticated'
    });
  });
});
