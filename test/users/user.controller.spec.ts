import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { BadRequestException } from '@nestjs/common';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto, UpdateRoleDto } from 'src/users/dto/user.dto';
import { createResponse } from 'node-mocks-http';
import * as httpMocks from 'node-mocks-http';
import { Response } from 'express';
import { PaginationDto } from 'src/common/pagination.dto';

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
  });

  // Get all users
  describe('getAllUsers', () => {
    it('should return all users with status 200', async () => {
      const res = httpMocks.createResponse();

      const mockUsers = [
        { id: 1, email: 'user1@example.com' },
        { id: 2, email: 'user2@example.com' },
      ];
      const query: PaginationDto = { page: 1, limit: 10 };

      await controller.getAllUsers(query, res as any);

      expect(mockUsersService.findAll).toHaveBeenCalledWith(1, 10);
      expect(res._getStatusCode()).toBe(200);
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
