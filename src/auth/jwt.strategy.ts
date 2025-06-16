import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';

/**
 * JwtStrategy is used to validate JWT tokens for protected routes.
 * It extracts the token from the Authorization header, verifies it,
 * and loads the corresponding user from the database.
 *
 * This strategy is automatically triggered by NestJS when JwtAuthGuard is used.
 */
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  version: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      // Throws error if the JWT secret is not defined in environment
      throw new Error('JWT_SECRET not defined in environment variables');
    }

    // Call the parent PassportStrategy constructor with options
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extract JWT from Authorization header as Bearer token
      ignoreExpiration: false, // Automatically reject expired tokens
      secretOrKey: jwtSecret, // Secret key used to verify the token's signature
    });
  }

  /**
   * This method is called automatically after the token is validated.
   * It receives the decoded payload from the token.
   *
   * @param payload - The decoded JWT payload (e.g., { sub, email, role, version })
   * @returns The user object to be attached to the request
   * @throws UnauthorizedException if the user is not found or token is invalid
   */
  async validate(payload: JwtPayload) {
    // Find user by email from payload
    const user = await this.usersService.findByEmail(payload.email);

    // Check if user exists and token version matches
    if (!user || user.tokenVersion !== payload.version) {
      throw new UnauthorizedException('Token version mismatch');
    }

    // Return user object (attached to req.user)
    return user;
  }
}
