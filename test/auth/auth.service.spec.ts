import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockJwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 1,
    email: 'user@example.com',
    password: 'hashedPass',
    role: Role.USER,
    tokenVersion: 1,
  };

  beforeEach(async () => {
    mockUsersService = {
      findByEmail: jest.fn(),
      incrementTokenVersion: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    mockJwtService = {
      sign: jest.fn(),
      signAsync: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user without password if valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('user@example.com', '1234');
      expect(result).toEqual({
        id: 1,
        email: 'user@example.com',
        role: 'USER',
        tokenVersion: 1,
      });
    });

    it('should throw if invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      (jest.spyOn(bcrypt, 'compare') as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('user@example.com', 'wrong'),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('login', () => {
    it('should return tokens and user info', async () => {
      mockJwtService.sign.mockReturnValue('access-token');
      process.env.REFRESH_TOKEN_SECRET = 'secret';
      const result = await service.login(mockUser);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'access-token',
        user: {
          id: 1,
          email: 'user@example.com',
          role: 'USER',
        },
      });
    });
  });

  describe('proxyLogin', () => {
    it('should throw if user is not admin', async () => {
      await expect(
        service.proxyLogin('target@example.com', {
          role: Role.USER,
          id: 0,
          email: '',
          password: '',
          tokenVersion: 0,
        }),
      ).rejects.toMatchObject({
        status: 403,
        message: 'You are not authorized to perform proxy login.',
      });
    });
    it('should throw if proxy user not found', async () => {
      mockUsersService.findByEmail.mockRejectedValue(
        new NotFoundException('User not found with this email'),
      );

      await expect(
        service.proxyLogin('target@example.com', {
          role: Role.ADMIN,
          id: 0,
          email: '',
          password: '',
          tokenVersion: 0,
        }),
      ).rejects.toMatchObject({
        status: 404,
        message: 'User not found with this email',
      });
    });

    // it('should throw if proxy user not found', async () => {
    //   mockUsersService.findByEmail.mockResolvedValue(null);

    //   await expect(
    //     service.proxyLogin('target@example.com', {
    //       role: Role.ADMIN,
    //       id: 0,
    //       email: '',
    //       password: '',
    //       tokenVersion: 0,
    //     }),
    //   ).rejects.toMatchObject({
    //     status: 404,
    //     message: 'Target user not found.',
    //   });
    // });

    it('should return proxy token and user info', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('proxy-token');

      const result = await service.proxyLogin('target@example.com', {
        role: Role.ADMIN,
        id: 0,
        email: '',
        password: '',
        tokenVersion: 0,
      });

      expect(result).toEqual({
        access_token: 'proxy-token',
        user: {
          id: 1,
          email: 'user@example.com',
          role: 'USER',
        },
      });
    });
  });

  describe('refreshToken', () => {
    beforeEach(() => {
      process.env.REFRESH_TOKEN_SECRET = 'secret';
    });

    it('should return new tokens if valid', async () => {
      mockJwtService.verify.mockReturnValue({
        email: 'user@example.com',
        version: 1,
      });
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('new-token');

      const result = await service.refreshToken('valid-token');

      expect(result).toEqual({
        accessToken: 'new-token',
        refreshToken: 'new-token',
      });
    });

    it('should throw if token version mismatched', async () => {
      mockJwtService.verify.mockReturnValue({
        email: 'user@example.com',
        version: 0,
      });
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        'Invalid refresh token',
      );
    });

    it('should throw if token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('bad-token')).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });

  describe('logout', () => {
    it('should increment token version and return success message', async () => {
      const result = await service.logout(mockUser);
      expect(mockUsersService.incrementTokenVersion).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Logged out from all devices.' });
    });
  });
});
