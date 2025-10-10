import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './login';
import { AuthService } from '../../../services/authService';

// Mock the AuthService
vi.mock('../../../services/authService', () => {
  return {
    AuthService: vi.fn().mockImplementation(() => ({
      login: vi.fn()
    }))
  };
});

describe('POST /api/auth/login', () => {
  let mockRequest: Request;
  let mockLocals: Record<string, any>;
  let mockAuthService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request
    mockRequest = new Request('https://example.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    // Setup mock Supabase client
    mockLocals = {
      supabase: {
        auth: {
          setSession: vi.fn()
        }
      }
    };

    // Get reference to mocked service
    mockAuthService = AuthService.mock.instances[0];
  });

  it('should return 200 with user data when login is successful', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };
    const mockSession = { access_token: 'token123' };

    mockAuthService.login.mockResolvedValue({
      user: mockUser,
      session: mockSession
    });

    // Act
    const response = await POST({ 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseBody).toEqual(mockUser);
    expect(mockAuthService.login).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
    expect(mockLocals.supabase.auth.setSession).toHaveBeenCalledWith(mockSession);
  });

  it('should return 401 when login credentials are invalid', async () => {
    // Arrange
    mockAuthService.login.mockRejectedValue(
      new Error('Login failed: Invalid credentials')
    );

    // Act
    const response = await POST({ 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(responseBody).toEqual({
      error: 'Invalid email or password'
    });
  });

  it('should return 400 when request body is invalid', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password123'
      })
    });

    // Act
    const response = await POST({ 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseBody.error).toContain('Invalid email format');
  });
});
