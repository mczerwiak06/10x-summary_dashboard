import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './[id]';
import { TranscriptService } from '../../../services/transcriptService';

// Mock the TranscriptService
vi.mock('../../../services/transcriptService', () => {
  return {
    TranscriptService: vi.fn().mockImplementation(() => ({
      getTranscript: vi.fn()
    }))
  };
});

describe('GET /api/transcripts/:id', () => {
  let mockRequest: Request;
  let mockParams: Record<string, string>;
  let mockLocals: Record<string, any>;
  let mockTranscriptService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request with auth header
    mockRequest = new Request('https://example.com/api/transcripts/123', {
      headers: {
        Authorization: 'Bearer valid-token'
      }
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

    // Get reference to mocked service
    mockTranscriptService = TranscriptService.mock.instances[0];
  });

  it('should return 200 with transcript data when found', async () => {
    // Arrange
    const mockTranscript = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      transcript_text: 'Test transcript content',
      created_at: '2023-01-01T12:00:00Z',
      user_id: 'user-123'
    };

    mockTranscriptService.getTranscript.mockResolvedValue(mockTranscript);

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
      id: mockTranscript.id,
      transcriptText: mockTranscript.transcript_text,
      createdAt: mockTranscript.created_at
    });
    expect(mockTranscriptService.getTranscript).toHaveBeenCalledWith(
      mockParams.id,
      'user-123'
    );
  });

  it('should return 404 when transcript is not found', async () => {
    // Arrange
    mockTranscriptService.getTranscript.mockResolvedValue(null);

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
    mockParams.id = 'not-a-uuid';

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
    mockRequest = new Request('https://example.com/api/transcripts/123');

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
