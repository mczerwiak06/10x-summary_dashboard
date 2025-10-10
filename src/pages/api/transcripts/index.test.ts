import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './index';
import { TranscriptService } from '../../../services/transcriptService';
import { SummarizationService } from '../../../services/summarizationService';
import { AnalyticsService } from '../../../services/analyticsService';

// Mock services
vi.mock('../../../services/transcriptService', () => ({
  TranscriptService: vi.fn().mockImplementation(() => ({
    createTranscript: vi.fn().mockResolvedValue('mock-transcript-id')
  }))
}));

vi.mock('../../../services/summarizationService', () => ({
  SummarizationService: vi.fn().mockImplementation(() => ({
    queueSummarization: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('../../../services/analyticsService', () => ({
  AnalyticsService: vi.fn().mockImplementation(() => ({
    trackEvent: vi.fn().mockResolvedValue('mock-analytics-id')
  }))
}));

describe('POST /api/transcripts', () => {
  let mockRequest;
  let mockContext;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock request
    mockRequest = new Request('https://example.com/api/transcripts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token'
      },
      body: JSON.stringify({
        transcriptText: 'This is a test transcript'
      })
    });

    // Mock Astro context
    mockContext = {
      locals: {
        supabase: {
          auth: {
            getUser: vi.fn().mockResolvedValue({
              data: { user: { id: 'mock-user-id' } },
              error: null
            })
          },
          functions: {
            invoke: vi.fn().mockResolvedValue({ error: null })
          }
        }
      }
    };
  });

  it('should return 202 with transcript ID and processing status', async () => {
    const response = await POST({ request: mockRequest, locals: mockContext.locals } as any);
    
    expect(response.status).toBe(202);
    
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      id: 'mock-transcript-id',
      status: 'processing'
    });
  });

  it('should call TranscriptService.createTranscript with correct parameters', async () => {
    await POST({ request: mockRequest, locals: mockContext.locals } as any);
    
    expect(TranscriptService).toHaveBeenCalledWith(mockContext.locals.supabase);
    expect(TranscriptService.mock.results[0].value.createTranscript)
      .toHaveBeenCalledWith('mock-user-id', 'This is a test transcript');
  });

  it('should call SummarizationService.queueSummarization with transcript ID', async () => {
    await POST({ request: mockRequest, locals: mockContext.locals } as any);
    
    expect(SummarizationService).toHaveBeenCalledWith(mockContext.locals.supabase);
    expect(SummarizationService.mock.results[0].value.queueSummarization)
      .toHaveBeenCalledWith('mock-transcript-id');
  });

  it('should call AnalyticsService.trackEvent with correct parameters', async () => {
    await POST({ request: mockRequest, locals: mockContext.locals } as any);
    
    expect(AnalyticsService).toHaveBeenCalledWith(mockContext.locals.supabase);
    expect(AnalyticsService.mock.results[0].value.trackEvent)
      .toHaveBeenCalledWith('transcript_created', 'mock-user-id', {
        transcriptId: 'mock-transcript-id'
      });
  });

  it('should return 401 when authorization header is missing', async () => {
    const requestWithoutAuth = new Request('https://example.com/api/transcripts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transcriptText: 'This is a test transcript'
      })
    });
    
    const response = await POST({ request: requestWithoutAuth, locals: mockContext.locals } as any);
    
    expect(response.status).toBe(401);
    
    const responseBody = await response.json();
    expect(responseBody).toEqual({
      error: 'Unauthenticated'
    });
  });

  it('should return 400 when body is missing transcriptText', async () => {
    const requestWithInvalidBody = new Request('https://example.com/api/transcripts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer valid-token'
      },
      body: JSON.stringify({})
    });
    
    const response = await POST({ request: requestWithInvalidBody, locals: mockContext.locals } as any);
    
    expect(response.status).toBe(400);
    
    const responseBody = await response.json();
    expect(responseBody.error).toContain('required');
  });
});
