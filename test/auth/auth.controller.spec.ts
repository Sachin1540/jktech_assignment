// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthController } from '../../src/auth/auth.controller';
// import { AuthService } from '../../src/auth/auth.service';
// import {
//   createRequest,
//   createResponse,
//   MockRequest,
//   MockResponse,
// } from 'node-mocks-http';
// import { Response } from 'express';
// import { Role } from 'src/auth/dto/enum/roles.enum';
// import { AuthenticatedRequest } from 'src/common/types/authenticated-request';

// describe('AuthController', () => {
//   let controller: AuthController;
//   let mockAuthService: jest.Mocked<AuthService>;

//   beforeEach(async () => {
//     mockAuthService = {
//       login: jest.fn(),
//       proxyLogin: jest.fn(),
//       refreshToken: jest.fn(),
//       logout: jest.fn(),
//     } as unknown as jest.Mocked<AuthService>;

//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [AuthController],
//       providers: [{ provide: AuthService, useValue: mockAuthService }],
//     }).compile();

//     controller = module.get<AuthController>(AuthController);
//   });
//   /**
//    * Test for POST /auth/login
//    * Scenario: User login using valid credentials.
//    * Guards: LocalAuthGuard must succeed (mocked).
//    * Expected: AuthService.login returns access and refresh tokens.
//    */
//   const res = createResponse() as MockResponse<Response>;

//   describe('login', () => {
//     it('should return tokens on successful login', async () => {
//       const mockUser = {
//         id: 1,
//         email: 'test@example.com',
//         role: Role.USER,
//         password: 'dummyPassword',
//         tokenVersion: 0,
//       };

//       const req = createRequest({
//         user: mockUser,
//       }) as MockRequest<AuthenticatedRequest>;

//       const mockLoginResponse = {
//         accessToken: 'abc',
//         refreshToken: 'xyz',
//         user: {
//           id: mockUser.id,
//           email: mockUser.email,
//           role: mockUser.role,
//         },
//       };

//       mockAuthService.login.mockResolvedValue(mockLoginResponse);

//       await controller.login(req, res);

//       expect(res._getStatusCode()).toBe(200);
//       expect(JSON.parse(res._getData())).toEqual(mockLoginResponse);
//     });
//   });

//   describe('adminProxy', () => {
//     /**
//      * Test for GET /auth/admin-proxy/:email
//      * Scenario: Admin uses proxy login with a valid target email.
//      * Guards: JwtAuthGuard, RolesGuard (mocked).
//      * Expected: AuthService.proxyLogin returns a token.
//      */
//     it('should proxy login as another user', async () => {
//       const req = createRequest({
//         user: {
//           id: 1,
//           email: 'admin@example.com',
//           role: Role.ADMIN,
//           password: 'secret',
//           tokenVersion: 0,
//         },
//       }) as MockRequest<AuthenticatedRequest>;

//       const params = { email: 'proxy@example.com' };
//       const mockProxyResponse = {
//         access_token: 'proxy',
//         user: {
//           id: 2,
//           email: 'proxy@example.com',
//           role: Role.USER,
//         },
//       };
//       mockAuthService.proxyLogin.mockResolvedValue(mockProxyResponse);

//       await controller.adminProxy(req, res, params);

//       expect(res._getStatusCode()).toBe(200);
//       expect(JSON.parse(res._getData())).toEqual(mockProxyResponse);
//     });
//     /**
//      * Test for failed proxy login.
//      * Scenario: AuthService throws an error.
//      * Expected: Responds with 400 and error message.
//      */
//     it('should return 400 if proxy login fails', async () => {
//       const req = createRequest({
//         user: {
//           id: 1,
//           email: 'admin@example.com',
//           role: Role.ADMIN,
//           password: 'secret',
//           tokenVersion: 0,
//         },
//       }) as MockRequest<AuthenticatedRequest>;

//       const params = { email: 'bad@example.com' };

//       mockAuthService.proxyLogin.mockRejectedValue(new Error('Not found'));

//       await controller.adminProxy(req, res, params);

//       expect(res._getStatusCode()).toBe(400);
//       expect(JSON.parse(res._getData()).message).toBe('Admin proxy failed');
//     });
//   });

//   describe('refresh', () => {
//     /**
//      * Test for POST /auth/refresh
//      * Scenario: Valid refresh token is provided.
//      * Guards: JwtAuthGuard, RolesGuard (mocked).
//      * Expected: Returns new access and refresh tokens.
//      */
//     it('should return new tokens on valid refresh', async () => {
//       mockAuthService.refreshToken.mockResolvedValue({
//         accessToken: 'new-access',
//         refreshToken: 'new-refresh',
//       });

//       await controller.refresh('valid-refresh-token', res);

//       expect(res._getStatusCode()).toBe(200);
//       expect(JSON.parse(res._getData())).toEqual({
//         accessToken: 'new-access',
//         refreshToken: 'new-refresh',
//       });
//     });
//     /**
//      * Scenario: Missing refresh token.
//      * Expected: Responds with 401 and error message.
//      */
//     it('should return 401 if refresh token is missing', async () => {
//       await controller.refresh('', res);

//       expect(res._getStatusCode()).toBe(401);
//     });
//     /**
//      * Scenario: Invalid refresh token causes failure.
//      * Expected: Responds with 403 and error message.
//      */
//     it('should return 403 if refresh fails', async () => {
//       mockAuthService.refreshToken.mockRejectedValue(
//         new Error('Token expired'),
//       );

//       await controller.refresh('expired-token', res);

//       expect(res._getStatusCode()).toBe(403);
//       expect(JSON.parse(res._getData())).toEqual({
//         message: 'Token expired',
//       });
//     });
//   });

//   describe('logout', () => {
//     /**
//      * Test for POST /auth/logout
//      * Scenario: Authenticated user logs out.
//      * Guards: JwtAuthGuard (mocked).
//      * Expected: Calls AuthService.logout and responds with success.
//      */
//     it('should logout user successfully', async () => {
//       const req = createRequest({
//         user: {
//           id: 1,
//           email: 'test@example.com',
//           role: Role.USER,
//           password: 'dummyPassword',
//           tokenVersion: 0,
//         },
//       }) as MockRequest<AuthenticatedRequest>;

//       mockAuthService.logout.mockResolvedValue({ message: 'Logged out' });

//       await controller.logout(req, res);

//       expect(res._getStatusCode()).toBe(200);
//       expect(JSON.parse(res._getData())).toEqual({ message: 'Logged out' });
//     });
//     /**
//      * Scenario: Logout fails due to backend error.
//      * Expected: Responds with 400 and error message.
//      */
//     it('should return 400 on logout failure', async () => {
//       const req = createRequest({
//         user: {
//           id: 1,
//           email: 'test@example.com',
//           role: Role.USER,
//           password: 'dummyPassword',
//           tokenVersion: 0,
//         },
//       }) as MockRequest<AuthenticatedRequest>;

//       mockAuthService.logout.mockRejectedValue(new Error('Logout error'));

//       await controller.logout(req, res);

//       expect(res._getStatusCode()).toBe(400);
//       expect(JSON.parse(res._getData()).message).toBe('Logout failed');
//     });
//   });
// });

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
