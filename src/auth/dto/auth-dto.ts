import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
/**
 * Data Transfer Object for user login.
 * 
 * Used to validate and document the structure of login requests.
 */
export class LoginDTO {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
/**
 * Data Transfer Object for user registration.
 * 
 * Used to validate and document the structure of new user registration requests.
 */
export class RegisterDTO {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token issued during login' })
  @IsString()
  refreshToken: string;
}
