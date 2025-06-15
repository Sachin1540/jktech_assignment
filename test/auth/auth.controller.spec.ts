import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { createRequest, createResponse } from 'node-mocks-http';
import { Role } from 'src/auth/dto/enum/roles.enum';


describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      proxyLogin: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const req = createRequest({ user: { id: 1 } });
      const res = createResponse();

      mockAuthService.login.mockResolvedValue({ accessToken: 'abc' });

      await controller.login(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ accessToken: 'abc' });
    });

    it('should return 400 on login failure', async () => {
      const req = createRequest({ user: { id: 1 } });
      const res = createResponse();

      mockAuthService.login.mockRejectedValue(new Error('Invalid creds'));

      await controller.login(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData()).message).toBe('Login failed');
    });
  });

  describe('adminProxy', () => {
    it('should proxy login as another user', async () => {
      const req = createRequest({ user: { id: 1, role: Role.ADMIN } });
      const res = createResponse();
      const params = { email: 'proxy@example.com' };

      mockAuthService.proxyLogin.mockResolvedValue({ accessToken: 'proxy' });

      await controller.adminProxy(req as any, res as any, params);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ accessToken: 'proxy' });
    });

    it('should return 400 if proxy login fails', async () => {
      const req = createRequest({ user: { id: 1, role: Role.ADMIN } });
      const res = createResponse();
      const params = { email: 'bad@example.com' };

      mockAuthService.proxyLogin.mockRejectedValue(new Error('Not found'));

      await controller.adminProxy(req as any, res as any, params);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData()).message).toBe('Admin proxy failed');
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh', async () => {
      const res = createResponse();

      mockAuthService.refreshToken.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      await controller.refresh('valid-refresh-token', res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });
    });

    it('should return 401 if refresh token is missing', async () => {
      const res = createResponse();
      await controller.refresh('', res as any);
      expect(res._getStatusCode()).toBe(401);
    });

    it('should return 403 if refresh fails', async () => {
      const res = createResponse();

      mockAuthService.refreshToken.mockRejectedValue(
        new Error('Token expired'),
      );

      await controller.refresh('expired-token', res as any);

      expect(res._getStatusCode()).toBe(403);
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Token expired',
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const req = createRequest({ user: { id: 1 } });
      const res = createResponse();

      mockAuthService.logout.mockResolvedValue({ message: 'Logged out' });

      await controller.logout(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ message: 'Logged out' });
    });

    it('should return 400 on logout failure', async () => {
      const req = createRequest({ user: { id: 1 } });
      const res = createResponse();

      mockAuthService.logout.mockRejectedValue(new Error('Logout error'));

      await controller.logout(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData()).message).toBe('Logout failed');
    });
  });
});
