import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './[id].delete';
import { SummaryService } from '../../../services/summaryService';

// Mock the SummaryService
vi.mock('../../../services/summaryService', () => {
  return {
    SummaryService: vi.fn().mockImplementation(() => ({
      deleteSummary: vi.fn()
    }))
  };
});

describe('DELETE /api/summaries/:id', () => {
  let mockRequest: Request;
  let mockParams: Record<string, string>;
  let mockLocals: Record<string, any>;
  let mockSummaryService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request with auth header
    mockRequest = new Request('https://example.com/api/summaries/123', {
      headers: {
        Authorization: 'Bearer valid-token'
      },
      method: 'DELETE'
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
    mockSummaryService = SummaryService.mock.instances[0];
  });

  it('should return 204 when summary is successfully deleted', async () => {
    // Arrange
    mockSummaryService.deleteSummary.mockResolvedValue(true);

    // Act
    const response = await DELETE({ 
      params: mockParams, 
      request: mockRequest, 
      locals: mockLocals 
    } as any);

    // Assert
    expect(response.status).toBe(204);
    expect(mockSummaryService.deleteSummary).toHaveBeenCalledWith(
      mockParams.id,
      'user-123'
    );
  });

  it('should return 404 when summary is not found', async () => {
    // Arrange
    mockSummaryService.deleteSummary.mockResolvedValue(false);

    // Act
    const response = await DELETE({ 
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
  });

  it('should return 400 when ID is not a valid UUID', async () => {
    // Arrange
    mockParams.id = 'not-a-uuid';

    // Act
    const response = await DELETE({ 
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

  it('should return 401 when auth header is missing', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/summaries/123', {
      method: 'DELETE'
    });

    // Act
    const response = await DELETE({ 
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
    const response = await DELETE({ 
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
