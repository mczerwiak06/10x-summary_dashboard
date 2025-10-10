import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './signup';
import { AuthService } from '../../../services/authService';

// Mock the AuthService
vi.mock('../../../services/authService', () => {
  return {
    AuthService: vi.fn().mockImplementation(() => ({
      signup: vi.fn()
    }))
  };
});

describe('POST /api/auth/signup', () => {
  let mockRequest: Request;
  let mockLocals: Record<string, any>;
  let mockAuthService: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock request
    mockRequest = new Request('https://example.com/api/auth/signup', {
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

  it('should return 201 with user data when signup is successful', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com'
    };
    const mockSession = { access_token: 'token123' };

    mockAuthService.signup.mockResolvedValue({
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
    expect(response.status).toBe(201);
    expect(responseBody).toEqual(mockUser);
    expect(mockAuthService.signup).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
    expect(mockLocals.supabase.auth.setSession).toHaveBeenCalledWith(mockSession);
  });

  it('should return 409 when email is already in use', async () => {
    // Arrange
    mockAuthService.signup.mockRejectedValue(
      new Error('Email already in use')
    );

    // Act
    const response = await POST({ 
      request: mockRequest, 
      locals: mockLocals 
    } as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(409);
    expect(responseBody).toEqual({
      error: 'Email already in use'
    });
  });

  it('should return 400 when request body is invalid', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'short'
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

  it('should return 400 when password is too short', async () => {
    // Arrange
    mockRequest = new Request('https://example.com/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'valid@example.com',
        password: 'short'
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
    expect(responseBody.error).toContain('Password must be at least 8 characters');
  });
});
