import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './[transcriptId]';
import { SummaryService } from '../../../../services/summaryService';

// Mock the SummaryService
vi.mock('../../../../services/summaryService', () => {
  return {
    SummaryService: vi.fn().mockImplementation(() => ({
      getSummarisationStatus: vi.fn()
    }))
  };
});

describe('GET /api/summarise/status/:transcriptId', () => {
  let mockRequest: Request;
  let mockParams: Record<string, string>;
  let mockLocals: Record<string, any>;
  let mockSummaryService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request with auth header
    mockRequest = new Request('https://example.com/api/summarise/status/123', {
      headers: {
        Authorization: 'Bearer valid-token'
      }
    });

    // Setup mock params
    mockParams = {
      transcriptId: '123e4567-e89b-12d3-a456-426614174000'
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

    // Get reference to mocked service
    mockSummaryService = SummaryService.mock.instances[0];
  });

  it('should return 200 with status when successful', async () => {
    // Arrange
    mockSummaryService.getSummarisationStatus.mockResolvedValue('processing');

    // Act
    const response = await GET({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      status: 'processing'
    });
    expect(mockSummaryService.getSummarisationStatus).toHaveBeenCalledWith(
      mockParams.transcriptId,
      'user-123'
    );
  });

  it('should return different statuses based on service response', async () => {
    // Test for 'ready' status
    mockSummaryService.getSummarisationStatus.mockResolvedValue('ready');
    const readyResponse = await GET({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const readyBody = await readyResponse.json();
    expect(readyBody).toEqual({ status: 'ready' });

    // Test for 'error' status
    mockSummaryService.getSummarisationStatus.mockResolvedValue('error');
    const errorResponse = await GET({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const errorBody = await errorResponse.json();
    expect(errorBody).toEqual({ status: 'error' });
  });

  it('should return 404 when transcript is not found', async () => {
    // Arrange
    mockSummaryService.getSummarisationStatus.mockRejectedValue(
      new Error('Transcript not found')
    );

    // Act
    const response = await GET({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(responseBody).toEqual({
      error: 'Transcript not found'
    });
  });

  it('should return 400 when ID is not a valid UUID', async () => {
    // Arrange
    mockParams.transcriptId = 'not-a-uuid';

    // Act
    const response = await GET({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      error: 'Invalid transcript ID format'
    });
  });

  it('should return 401 when auth header is missing', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/summarise/status/123');

    // Act
    const response = await GET({ 
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

  it('should return 401 when auth token is invalid', async () => {
    // Arrange
    mockLocals.supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' }
    });

    // Act
    const response = await GET({ 
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
