import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse,
} from 'node-mocks-http';
import { Response } from 'express';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      proxyLogin: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });
  /**
   * Test for POST /auth/login
   * Scenario: User login using valid credentials.
   * Guards: LocalAuthGuard must succeed (mocked).
   * Expected: AuthService.login returns access and refresh tokens.
   */
  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: Role.USER,
        password: 'dummyPassword',
        tokenVersion: 0,
      };

      const req = createRequest({
        user: mockUser,
      }) as MockRequest<AuthenticatedRequest>;

      const res = createResponse() as MockResponse<Response>;

      const mockLoginResponse = {
        accessToken: 'abc',
        refreshToken: 'xyz',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        },
      };

      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      await controller.login(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockLoginResponse);
    });
  });

  describe('adminProxy', () => {
    /**
     * Test for GET /auth/admin-proxy/:email
     * Scenario: Admin uses proxy login with a valid target email.
     * Guards: JwtAuthGuard, RolesGuard (mocked).
     * Expected: AuthService.proxyLogin returns a token.
     */
    it('should proxy login as another user', async () => {
      const req = createRequest({
        user: {
          id: 1,
          email: 'admin@example.com',
          role: Role.ADMIN,
          password: 'secret',
          tokenVersion: 0,
        },
      }) as MockRequest<AuthenticatedRequest>;

      const res = createResponse() as MockResponse<Response>;
      const params = { email: 'proxy@example.com' };
      const mockProxyResponse = {
        access_token: 'proxy',
        user: {
          id: 2,
          email: 'proxy@example.com',
          role: Role.USER,
        },
      };
      mockAuthService.proxyLogin.mockResolvedValue(mockProxyResponse);

      await controller.adminProxy(req, res, params);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockProxyResponse);
    });
    /**
     * Test for failed proxy login.
     * Scenario: AuthService throws an error.
     * Expected: Responds with 400 and error message.
     */
    it('should return 400 if proxy login fails', async () => {
      const req = createRequest({
        user: {
          id: 1,
          email: 'admin@example.com',
          role: Role.ADMIN,
          password: 'secret',
          tokenVersion: 0,
        },
      }) as MockRequest<AuthenticatedRequest>;

      const res = createResponse() as MockResponse<Response>;
      const params = { email: 'bad@example.com' };

      mockAuthService.proxyLogin.mockRejectedValue(new Error('Not found'));

      await controller.adminProxy(req, res, params);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData()).message).toBe('Admin proxy failed');
    });
  });

  describe('refresh', () => {
    /**
     * Test for POST /auth/refresh
     * Scenario: Valid refresh token is provided.
     * Guards: JwtAuthGuard, RolesGuard (mocked).
     * Expected: Returns new access and refresh tokens.
     */
    it('should return new tokens on valid refresh', async () => {
      const res = createResponse() as MockResponse<Response>;

      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      await controller.refresh('valid-refresh-token', res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });
    /**
     * Scenario: Missing refresh token.
     * Expected: Responds with 401 and error message.
     */
    it('should return 401 if refresh token is missing', async () => {
      const res = createResponse() as MockResponse<Response>;

      await controller.refresh('', res);

      expect(res._getStatusCode()).toBe(401);
    });
    /**
     * Scenario: Invalid refresh token causes failure.
     * Expected: Responds with 403 and error message.
     */
    it('should return 403 if refresh fails', async () => {
      const res = createResponse() as MockResponse<Response>;

      mockAuthService.refreshToken.mockRejectedValue(
        new Error('Token expired'),
      );

      await controller.refresh('expired-token', res);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Token expired',
      });
    });
  });

  describe('logout', () => {
    /**
     * Test for POST /auth/logout
     * Scenario: Authenticated user logs out.
     * Guards: JwtAuthGuard (mocked).
     * Expected: Calls AuthService.logout and responds with success.
     */
    it('should logout user successfully', async () => {
      const req = createRequest({
        user: {
          id: 1,
          email: 'test@example.com',
          role: Role.USER,
          password: 'dummyPassword',
          tokenVersion: 0,
        },
      }) as MockRequest<AuthenticatedRequest>;

      const res = createResponse() as MockResponse<Response>;

      mockAuthService.logout.mockResolvedValue({ message: 'Logged out' });

      await controller.logout(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ message: 'Logged out' });
    });
    /**
     * Scenario: Logout fails due to backend error.
     * Expected: Responds with 400 and error message.
     */
    it('should return 400 on logout failure', async () => {
      const req = createRequest({
        user: {
          id: 1,
          email: 'test@example.com',
          role: Role.USER,
          password: 'dummyPassword',
          tokenVersion: 0,
        },
      }) as MockRequest<AuthenticatedRequest>;

      const res = createResponse() as MockResponse<Response>;

      mockAuthService.logout.mockRejectedValue(new Error('Logout error'));

      await controller.logout(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData()).message).toBe('Logout failed');
    });
  });
});
