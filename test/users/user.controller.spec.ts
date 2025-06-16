import { Test, TestingModule } from '@nestjs/testing';

import { Role } from 'src/auth/dto/enum/roles.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto, UpdateRoleDto } from 'src/users/dto/user.dto';
import { createResponse } from 'node-mocks-http';
import * as httpMocks from 'node-mocks-http';

import { Response } from 'express';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: Role.USER,
    tokenVersion: 0,
  };

  const mockUsersService = {
    register: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateRole: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  const res = createResponse() as Response;
  // Register
  describe('register', () => {
    it('should register a new user', async () => {
      mockUsersService.register.mockResolvedValue(mockUser);

      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password',
        role: Role.USER,
      };

      const result = await controller.register(dto);
      expect(result).toEqual(mockUser);
      expect(mockUsersService.register).toHaveBeenCalledWith(dto);
    });
    it('should handle registration failure', async () => {
      mockUsersService.register.mockRejectedValue(
        new Error('Registration failed'),
      );

      await expect(
        controller.register({
          email: 'fail@example.com',
          password: 'pass',
          role: Role.USER,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        controller.register({
          email: 'fail@example.com',
          password: 'pass',
          role: Role.USER,
        }),
      ).rejects.toMatchObject({
        response: {
          success: false,
          message: 'Registration failed',
          error: 'Registration failed',
        },
      });
    });

    // it('should handle registration failure', async () => {
    //   mockUsersService.register.mockRejectedValue(
    //     new Error('Registration failed'),
    //   );

    //   const result = await controller.register({
    //     email: 'fail@example.com',
    //     password: 'pass',
    //     role: Role.USER,
    //   });

    //   if ('success' in result && result.success === false) {
    //     expect(result.message).toBe('Registration failed');
    //   } else {
    //     fail('Expected error response with success: false');
    //   }
    // });
  });

  // Get all users
  describe('getAllUsers', () => {
    it('should return a list of users', async () => {
      mockUsersService.findAll.mockResolvedValue([mockUser]);
      const result = await controller.getAllUsers();
      expect(result).toEqual([mockUser]);
    });

    it('should handle error', async () => {
      mockUsersService.findAll.mockRejectedValue(new Error('DB error'));

      const result = await controller.getAllUsers();

      if ('success' in result && result.success === false) {
        expect(result.message).toBe('Failed to get users');
        expect(result.error).toBe('DB error');
      } else {
        fail('Expected error response');
      }
    });
  });

  // Get user by ID
  describe('getUserById', () => {
    it('should return user by id', async () => {
      const user = { id: 1, email: 'test@example.com' };
      const res = httpMocks.createResponse();
      mockUsersService.findById.mockResolvedValue(user);

      const controller = new UsersController(mockUsersService as any);
      await controller.getUserById(1, res as Response);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(user);
    });

    it('should handle user not found', async () => {
      const res = httpMocks.createResponse();
      mockUsersService.findById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      const controller = new UsersController(mockUsersService as any);
      await controller.getUserById(999, res as Response);

      expect(res._getStatusCode()).toBe(404);
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'Failed to get user',
        error: 'User not found',
      });
    });
  });

  // Update role
  describe('updateUserRole', () => {
    it('should update role successfully', async () => {
      const dto: UpdateRoleDto = { role: Role.ADMIN };
      const res = httpMocks.createResponse();
      const result = { success: true };
      mockUsersService.updateRole.mockResolvedValue(result);

      const controller = new UsersController(mockUsersService as any);
      await controller.updateUserRole(res as Response, 1, dto);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(result);
    });

    it('should handle role update error', async () => {
      const res = httpMocks.createResponse();
      mockUsersService.updateRole.mockRejectedValue({
        message: 'Invalid role',
        status: 400,
      });

      const controller = new UsersController(mockUsersService as any);
      await controller.updateUserRole(res as Response, 1, {
        role: 'INVALID',
      } as any);

      expect(res._getStatusCode()).toBe(400);
      expect(res._getJSONData()).toEqual({ message: 'Invalid role' });
    });
  });

  // Delete user
  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const res = httpMocks.createResponse();
      const result = { success: true };
      mockUsersService.remove.mockResolvedValue(result);

      const controller = new UsersController(mockUsersService as any);
      await controller.deleteUser(1, res as Response);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getJSONData()).toEqual(result);
    });

    it('should handle delete failure', async () => {
      const res = httpMocks.createResponse();
      mockUsersService.remove.mockRejectedValue({
        message: 'Delete error',
        status: 500,
      });

      const controller = new UsersController(mockUsersService as any);
      await controller.deleteUser(1, res as Response);

      expect(res._getStatusCode()).toBe(500);
      expect(res._getJSONData()).toEqual({ message: 'Delete error' });
    });
  });
});
