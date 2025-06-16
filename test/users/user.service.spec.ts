import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { UsersService } from 'src/users/users.service';
import { Users } from 'src/users/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<Users>>;

  const mockUser: Users = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    role: Role.USER,
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(Users),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(Users));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw conflict if email already exists', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      const dto = {
        email: 'test@example.com',
        password: 'password',
        role: Role.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should register and return new user without password', async () => {
      repo.findOne.mockResolvedValue(null);
      const hashed = 'hashedpassword';
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpassword' as never);

      repo.create.mockReturnValue({ ...mockUser, password: hashed });
      repo.save.mockResolvedValue({ ...mockUser, password: hashed });

      const dto = {
        email: 'test1@example.com',
        password: 'password',
        role: Role.USER,
      };

      const result = await service.register(dto);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenVersion: mockUser.tokenVersion,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('findById', () => {
    it('should return user if found', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      const result = await service.findById(1);
      expect(result).toEqual(mockUser);
    });

    it('should throw if user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('should update the user role', async () => {
      repo.findOne.mockResolvedValue({ ...mockUser });
      repo.save.mockResolvedValue({ ...mockUser, role: Role.ADMIN });

      const result = await service.updateRole(1, Role.ADMIN);
      expect(result.role).toBe(Role.ADMIN);
    });
  });

  describe('remove', () => {
    it('should delete the user if exists', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      repo.delete.mockResolvedValue({ affected: 1, raw: {} }); // mock full DeleteResult

      const result = await service.remove(1);
      expect(result).toEqual({ affected: 1, raw: {} });
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementTokenVersion', () => {
    it('should increment and return true if affected', async () => {
      repo.increment.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      });
      const result = await service.incrementTokenVersion(1);
      expect(result).toBe(true);
    });

    it('should throw if increment fails', async () => {
      repo.increment.mockRejectedValue(new Error('fail'));
      await expect(service.incrementTokenVersion(1)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const users: Partial<Users>[] = [
        { id: 1, email: 'a@a.com', role: Role.USER },
      ];
      repo.find.mockResolvedValue(users as Users[]);
      const result = await service.findAll();
      expect(result).toEqual(users);
    });
  });

  describe('findByEmail', () => {
    it('should return user if found', async () => {
      repo.findOne.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should throw if not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByEmail('x@x.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
