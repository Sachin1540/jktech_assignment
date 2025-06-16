import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * LocalStrategy handles user credential validation using Passport's 'local' strategy.
 *
 * It overrides the default username field to use 'email' instead of 'username'.
 * This strategy is invoked automatically by LocalAuthGuard when a login attempt is made.
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

@Injectable()
export class LocalAuthGuard extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Configure the strategy to use 'email' instead of the default 'username'
    super({ usernameField: 'email' });
  }

  /**
   * Validates the user's email and password.
   *
   * @param email - The user's email
   * @param password - The user's password
   * @returns The user object if validation is successful
   * @throws UnauthorizedException if credentials are invalid
   */
  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user; // This will be attached to req.user
  }
}
