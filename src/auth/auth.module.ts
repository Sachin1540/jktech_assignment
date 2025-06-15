import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { LocalAuthGuard } from './local.strategy';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  // Importing required modules
  imports: [
    UsersModule, // Provides access to user-related services and database queries
    PassportModule, // Required for using Passport strategies like local or JWT
    ConfigModule, // Enables usage of environment variables via ConfigService

    // Register JwtModule asynchronously to use ConfigService for dynamic secret injection
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Fetching secret from environment variables
        signOptions: { expiresIn: '1d' }, // Token expiration duration
      }),
    }),
  ],

  // Registering controllers
  controllers: [AuthController], // Handles incoming requests like login, logout, refresh, etc.

  // Registering providers (services and guards)
  providers: [
    AuthService, // Business logic for authentication
    JwtStrategy, // Strategy to validate JWT tokens
    LocalAuthGuard, // Guard to validate local username/password login
    JwtAuthGuard, // Guard to protect routes using JWT
    RolesGuard, // Guard to restrict access based on user roles
  ],

  // Exporting JwtModule to be reused in other modules if needed (e.g., for token generation)
  exports: [JwtModule],
})
export class AuthModule {}
