import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './[transcriptId].post';
import { SummaryService } from '../../../services/summaryService';
import { AnalyticsService } from '../../../services/analyticsService';

// Mock the services
vi.mock('../../../services/summaryService', () => {
  return {
    SummaryService: vi.fn().mockImplementation(() => ({
      storeGeneratedSummary: vi.fn()
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

// Mock environment variables
vi.mock('astro:env', () => {
  return {
    default: {
      WORKER_SECRET: 'test-worker-secret'
    }
  };
});

describe('POST /api/summarise/:transcriptId', () => {
  let mockRequest: Request;
  let mockParams: Record<string, string>;
  let mockLocals: Record<string, any>;
  let mockSummaryService: any;
  let mockAnalyticsService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request with worker secret
    mockRequest = new Request('https://example.com/api/summarise/123', {
      method: 'POST',
      headers: {
        'X-Worker-Secret': 'test-worker-secret',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summaryMarkdown: 'Generated summary content'
      })
    });

    // Setup mock params
    mockParams = {
      transcriptId: '123e4567-e89b-12d3-a456-426614174000'
    };

    // Setup mock Supabase client
    mockLocals = {
      supabase: {}
    };

    // Get reference to mocked services
    mockSummaryService = SummaryService.mock.instances[0];
    mockAnalyticsService = AnalyticsService.mock.instances[0];
  });

  it('should return 201 with created summary when successful', async () => {
    // Arrange
    const mockSummary = {
      id: 'summary-123',
      summary_markdown: 'Generated summary content',
      transcript_id: '123e4567-e89b-12d3-a456-426614174000',
      created_at: '2023-01-01T12:00:00Z',
      updated_at: '2023-01-01T12:00:00Z',
      user_id: 'user-123'
    };

    mockSummaryService.storeGeneratedSummary.mockResolvedValue(mockSummary);
    mockAnalyticsService.trackEvent.mockResolvedValue(undefined);

    // Act
    const response = await POST({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(responseBody).toEqual({
      id: mockSummary.id,
      summaryMarkdown: mockSummary.summary_markdown,
      transcriptId: mockSummary.transcript_id,
      createdAt: mockSummary.created_at,
      updatedAt: mockSummary.updated_at
    });
    expect(mockSummaryService.storeGeneratedSummary).toHaveBeenCalledWith(
      mockParams.transcriptId,
      'Generated summary content'
    );
    expect(mockAnalyticsService.trackEvent).toHaveBeenCalledWith(
      'summary_generated',
      'user-123',
      { summaryId: mockSummary.id }
    );
  });

  it('should return 409 when summary already exists', async () => {
    // Arrange
    mockSummaryService.storeGeneratedSummary.mockRejectedValue(
      new Error('Summary already exists for this transcript')
    );

    // Act
    const response = await POST({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(409);
    expect(responseBody).toEqual({
      error: 'Conflict'
    });
  });

  it('should return 403 when worker secret is missing', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/summarise/123', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summaryMarkdown: 'Generated summary content'
      })
    });

    // Act
    const response = await POST({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(responseBody).toEqual({
      error: 'Forbidden'
    });
  });

  it('should return 403 when worker secret is invalid', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/summarise/123', {
      method: 'POST',
      headers: {
        'X-Worker-Secret': 'invalid-secret',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summaryMarkdown: 'Generated summary content'
      })
    });

    // Act
    const response = await POST({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(responseBody).toEqual({
      error: 'Forbidden'
    });
  });

  it('should return 400 when request body is invalid', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/summarise/123', {
      method: 'POST',
      headers: {
        'X-Worker-Secret': 'test-worker-secret',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Missing summaryMarkdown
      })
    });

    // Act
    const response = await POST({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseBody.error).toContain('summaryMarkdown is required');
  });
});
