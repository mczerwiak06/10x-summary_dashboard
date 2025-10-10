import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './index';
import { AnalyticsService } from '../../../services/analyticsService';

// Mock the AnalyticsService
vi.mock('../../../services/analyticsService', () => {
  return {
    AnalyticsService: vi.fn().mockImplementation(() => ({
      listEvents: vi.fn(),
      isAdmin: vi.fn()
    }))
  };
});

describe('GET /api/analytics', () => {
  let mockRequest: Request;
  let mockLocals: Record<string, any>;
  let mockAnalyticsService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request with auth header
    mockRequest = new Request('https://example.com/api/analytics?limit=10', {
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
    mockAnalyticsService = AnalyticsService.mock.instances[0];
  });

  it('should return 200 with paginated events for the current user', async () => {
    // Arrange
    const mockEvents = [
      {
        id: 'event-1',
        event_type: 'summary_generated',
        created_at: '2023-01-01T12:00:00Z',
        user_id: 'user-123',
        summary_id: 'summary-1'
      },
      {
        id: 'event-2',
        event_type: 'summary_accepted',
        created_at: '2023-01-01T11:00:00Z',
        user_id: 'user-123',
        summary_id: 'summary-1'
      }
    ];

    mockAnalyticsService.listEvents.mockResolvedValue({
      items: mockEvents,
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
          id: 'event-1',
          eventType: 'summary_generated',
          createdAt: '2023-01-01T12:00:00Z',
          userId: 'user-123',
          summaryId: 'summary-1'
        },
        {
          id: 'event-2',
          eventType: 'summary_accepted',
          createdAt: '2023-01-01T11:00:00Z',
          userId: 'user-123',
          summaryId: 'summary-1'
        }
      ],
      nextCursor: '2023-01-01T11:00:00Z'
    });
    expect(mockAnalyticsService.listEvents).toHaveBeenCalledWith(
      'user-123',
      'user-123',
      expect.objectContaining({ limit: 10 })
    );
  });

  it('should allow admins to view another user\'s events', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/analytics?userId=user-456', {
      headers: {
        Authorization: 'Bearer valid-token'
      }
    });

    mockAnalyticsService.listEvents.mockResolvedValue({
      items: [],
      nextCursor: undefined
    });

    // Act
    await GET({ 
      request: mockRequest, 
      locals: mockLocals 
    } as any);

    // Assert
    expect(mockAnalyticsService.listEvents).toHaveBeenCalledWith(
      'user-123',
      'user-456',
      expect.anything()
    );
  });

  it('should return 403 when non-admin tries to view another user\'s events', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/analytics?userId=user-456', {
      headers: {
        Authorization: 'Bearer valid-token'
      }
    });

    mockAnalyticsService.listEvents.mockRejectedValue(
      new Error('Forbidden: Only admins can view other users\' analytics')
    );

    // Act
    const response = await GET({ 
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

  it('should return 401 when auth header is missing', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/analytics');

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
    mockRequest = new Request('https://example.com/api/analytics?cursor=invalid-date', {
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
