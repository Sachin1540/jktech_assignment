import { Test, TestingModule } from '@nestjs/testing';

import { Role } from 'src/auth/dto/enum/roles.enum';
import { NotFoundException } from '@nestjs/common';
import { UsersController } from 'src/users/users.controller';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dto/user.dto';

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

      const result = await controller.register({
        email: 'fail@example.com',
        password: 'pass',
        role: Role.USER,
      });

      if ('success' in result && result.success === false) {
        expect(result.message).toBe('Registration failed');
      } else {
        fail('Expected error response with success: false');
      }
    });
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
    const mockResponse = () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      return res as any;
    };

    it('should return user by ID', async () => {
      const res = mockResponse();
      mockUsersService.findById.mockResolvedValue(mockUser);

      await controller.getUserById(1, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 if user not found', async () => {
      const res = mockResponse();
      mockUsersService.findById.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await controller.getUserById(99, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get user',
        error: 'User not found',
      });
    });
  });

  // Update role
  describe('updateUserRole', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    it('should update user role', async () => {
      mockUsersService.updateRole.mockResolvedValue({
        ...mockUser,
        role: Role.ADMIN,
      });

      await controller.updateUserRole(res as any, 1, { role: Role.ADMIN });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ ...mockUser, role: Role.ADMIN });
    });

    it('should handle error on role update', async () => {
      mockUsersService.updateRole.mockRejectedValue({
        status: 400,
        message: 'Invalid role',
      });

      await controller.updateUserRole(res as any, 1, {
        role: 'INVALID' as Role,
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid role' });
    });
  });

  // Delete user
  describe('deleteUser', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    it('should delete a user', async () => {
      mockUsersService.remove.mockResolvedValue({ affected: 1, raw: {} });

      await controller.deleteUser(1, res as any);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ affected: 1, raw: {} });
    });

    it('should return error if deletion fails', async () => {
      mockUsersService.remove.mockRejectedValue({
        status: 500,
        message: 'Failed to delete',
      });

      await controller.deleteUser(99, res as any);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to delete' });
    });
  });
});
