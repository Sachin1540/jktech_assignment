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

/**
 * Service for managing user operations such as registering,
 * retrieving, updating, and deleting users.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Registers a new user with a hashed password.
   * @param createUserDto Data required to create a new user.
   * @returns The created user without the password field.
   * @throws ConflictException if the email is already registered.
   * @throws InternalServerErrorException if saving the user fails.
   */
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

  /**
   * Finds a user by email.
   * @param email The email address to search for.
   * @returns The matching user.
   * @throws NotFoundException if no user is found.
   */
  async findByEmail(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found with this email');
    }
    return user;
  }

  /**
   * Increments a user's token version to invalidate existing JWTs.
   * @param userId The ID of the user.
   * @returns True if the token version was successfully incremented.
   * @throws InternalServerErrorException if the operation fails.
   */
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

  /**
   * Retrieves all users, excluding password fields.
   * @returns An array of user objects with id, email, and role.
   */
  async findAll() {
    return this.userRepository.find({ select: ['id', 'email', 'role'] });
  }

  /**
   * Finds a user by ID.
   * @param id The ID of the user.
   * @returns The matching user.
   * @throws NotFoundException if the user is not found.
   */
  async findById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * Updates a user's role.
   * @param id The ID of the user.
   * @param role The new role to assign.
   * @returns The updated user object.
   * @throws NotFoundException if the user does not exist.
   */
  async updateRole(id: number, role: Role) {
    const user = await this.findById(id);
    user.role = role;
    return this.userRepository.save(user);
  }

  /**
   * Deletes a user by ID after checking existence.
   * @param id The ID of the user to delete.
   * @returns The result of the delete operation.
   * @throws NotFoundException if the user does not exist.
   */
  async remove(id: number) {
    await this.findById(id);
    return this.userRepository.delete(id);
  }
}
