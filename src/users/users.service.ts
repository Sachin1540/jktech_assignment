import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { CreateUserDto } from './dto/user.dto';
import { Role } from 'src/auth/dto/enum/roles.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Register a new user
  async register(createUserDto: CreateUserDto) {
    const { email, password, role } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS ?? '10', 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = this.userRepository.create({
      email,
      password: hashedPassword,
      role,
    });

    try {
      const savedUser = await this.userRepository.save(newUser);
      const { password, ...result } = savedUser;
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  // Find a user by email
  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found with this email');
    }
    return user;
  }

  // Invalidate all previous JWTs by incrementing tokenVersion
  async incrementTokenVersion(userId: number): Promise<boolean> {
    try {
      const result = await this.userRepository.increment(
        { id: userId },
        'tokenVersion',
        1,
      );
      return result.affected === 1;
    } catch (error) {
      throw new InternalServerErrorException(
        'Could not increment token version',
      );
    }
  }

  // Get all users (exclude password)
  async findAll() {
    return this.userRepository.find({ select: ['id', 'email', 'role'] });
  }

  // Find user by ID
  async findById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  // Update user's role
  async updateRole(id: number, role: Role) {
    const user = await this.findById(id);
    console.log('user: ', user);
    user.role = role;
    return this.userRepository.save(user);
  }

  // Delete user
  async remove(id: number) {
    await this.findById(id);
    return this.userRepository.delete(id);
  }
}
