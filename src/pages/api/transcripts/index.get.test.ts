import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './index.get';
import { TranscriptService } from '../../../services/transcriptService';

// Mock the TranscriptService
vi.mock('../../../services/transcriptService', () => {
  return {
    TranscriptService: vi.fn().mockImplementation(() => ({
      listTranscripts: vi.fn()
    }))
  };
});

describe('GET /api/transcripts', () => {
  let mockRequest: Request;
  let mockLocals: Record<string, any>;
  let mockTranscriptService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request with auth header
    mockRequest = new Request('https://example.com/api/transcripts?limit=10', {
      headers: {
        Authorization: 'Bearer valid-token'
      }
    });

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

  it('should return 200 with paginated transcripts', async () => {
    // Arrange
    const mockTranscripts = [
      {
        id: 'transcript-1',
        transcript_text: 'Test transcript 1',
        created_at: '2023-01-01T12:00:00Z',
        user_id: 'user-123'
      },
      {
        id: 'transcript-2',
        transcript_text: 'Test transcript 2',
        created_at: '2023-01-01T11:00:00Z',
        user_id: 'user-123'
      }
    ];

    mockTranscriptService.listTranscripts.mockResolvedValue({
      items: mockTranscripts,
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
          id: 'transcript-1',
          transcriptText: 'Test transcript 1',
          createdAt: '2023-01-01T12:00:00Z'
        },
        {
          id: 'transcript-2',
          transcriptText: 'Test transcript 2',
          createdAt: '2023-01-01T11:00:00Z'
        }
      ],
      nextCursor: '2023-01-01T11:00:00Z'
    });
    expect(mockTranscriptService.listTranscripts).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({ limit: 10 })
    );
  });

  it('should return 401 when auth header is missing', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/transcripts');

    // Act
    const response = await GET({ 
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

  it('should return 400 when pagination parameters are invalid', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/transcripts?cursor=invalid-date', {
      headers: {
        Authorization: 'Bearer valid-token'
      }
    });

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
