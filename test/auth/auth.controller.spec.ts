import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { createRequest, MockRequest } from 'node-mocks-http';
import { AuthController } from 'src/auth/auth.controller';
import { AuthService } from 'src/auth/auth.service';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';
import { Users } from 'src/users/user.entity';

const mockAuthService = {
  login: jest.fn(),
  proxyLogin: jest.fn(),
  refreshToken: jest.fn(),
  logout: jest.fn(),
};

const mockUser = {
  id: 'user-id',
  email: 'user@example.com',
  role: Role.USER,
};

const mockAdmin: Users = {
  id: 1,
  email: 'admin@example.com',
  password: 'dummy',
  tokenVersion: 0,
  role: Role.ADMIN,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const req = createRequest({
  user: mockUser,
}) as MockRequest<AuthenticatedRequest>;
describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  let res;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login a user and return tokens', async () => {
      const tokens = { accessToken: 'access', refreshToken: 'refresh' };
      mockAuthService.login.mockResolvedValue(tokens);

      // const req = { user: mockUser };

      await controller.login(req, res as Response);

      expect(service.login).toHaveBeenCalledWith(mockUser);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(tokens);
    });

    it('should handle login failure', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      // const req = { user: mockUser };

      await controller.login(req, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login failed',
        error: expect.any(Error),
      });
    });
  });

  describe('adminProxy', () => {
    it('should allow admin to proxy login for another user', async () => {
      const result = {
        accessToken: 'admin-proxy-access',
        refreshToken: 'admin-proxy-refresh',
      };
      mockAuthService.proxyLogin.mockResolvedValue(result);

      const req1 = {
        user: mockAdmin,
      } as Partial<AuthenticatedRequest> as AuthenticatedRequest;

      const params = { email: 'target@example.com' };

      await controller.adminProxy(req1, res as Response, params);

      expect(service.proxyLogin).toHaveBeenCalledWith(
        'target@example.com',
        mockAdmin,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });

    // it('should allow admin to proxy login for another user', async () => {
    //   const result = {
    //     accessToken: 'admin-proxy-access',
    //     refreshToken: 'admin-proxy-refresh',
    //   };
    //   mockAuthService.proxyLogin.mockResolvedValue(result);

    //   // const req = { user: mockAdmin };
    //   const params = { email: 'target@example.com' };

    //   await controller.adminProxy(req, res as Response, params);

    //   expect(service.proxyLogin).toHaveBeenCalledWith(
    //     'target@example.com',
    //     mockAdmin,
    //   );
    //   expect(res.status).toHaveBeenCalledWith(200);
    //   expect(res.json).toHaveBeenCalledWith(result);
    // });

    it('should handle proxy login failure', async () => {
      mockAuthService.proxyLogin.mockRejectedValue(new Error('User not found'));

      // const req = { user: mockAdmin };
      const params = { email: 'missing@example.com' };

      await controller.adminProxy(req, res as Response, params);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin proxy failed',
        error: expect.any(Error),
      });
    });
  });
});
