import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './logout';
import { AuthService } from '../../../services/authService';

// Mock the AuthService
vi.mock('../../../services/authService', () => {
  return {
    AuthService: vi.fn().mockImplementation(() => ({
      logout: vi.fn()
    }))
  };
});

describe('POST /api/auth/logout', () => {
  let mockLocals: Record<string, any>;
  let mockAuthService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock Supabase client
    mockLocals = {
      supabase: {}
    };

    // Get reference to mocked service
    mockAuthService = AuthService.mock.instances[0];
  });

  it('should return 204 when logout is successful', async () => {
    // Arrange
    mockAuthService.logout.mockResolvedValue(true);

    // Act
    const response = await POST({ 
      locals: mockLocals 
    } as any);

    // Assert
    expect(response.status).toBe(204);
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should return 500 when logout fails', async () => {
    // Arrange
    mockAuthService.logout.mockRejectedValue(
      new Error('Logout failed')
    );

    // Act
    const response = await POST({ 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(responseBody).toEqual({
      error: 'Internal server error'
    });
  });
});
