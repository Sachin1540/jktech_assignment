import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/auth/dto/enum/roles.enum';

/**
 * Data Transfer Object used to create a new user.
 * Includes validation and Swagger documentation.
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'StrongPass123',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'Role assigned to the user',
    enum: Role,
    example: Role.USER,
  })
  @IsEnum(Role, {
    message: 'Role must be one of: ADMIN, USER, VIEWER',
  })
  role: Role;
}

/**
 * DTO for updating the role of an existing user.
 */
export class UpdateRoleDto {
  @ApiProperty({
    description: 'New role for the user',
    enum: Role,
    example: Role.USER,
  })
  @IsEnum(Role, {
    message: 'Role must be one of: ADMIN, USER, VIEWER',
  })
  role: Role;
}
