import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/user.entity';
import { Role } from './dto/enum/roles.enum';
interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  version: number;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validates user credentials (email and password).
   *
   * @param email - User's email address.
   * @param password - Plain text password to verify.
   * @returns User object without password if valid.
   * @throws UnauthorizedException if credentials are invalid.
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException();
  }

  /**
   * Logs in a validated user and generates access and refresh tokens.
   *
   * @param user - User object (without password) from LocalStrategy.
   * @returns Object containing tokens and minimal user info.
   */
  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      version: user.tokenVersion,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '30m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  /**
   * Allows an admin to login as another user.
   *
   * @param email - Target user's email.
   * @param user - Currently logged-in admin user.
   * @returns New access token and proxy user info.
   * @throws Forbidden if non-admin tries proxy login.
   * @throws Not Found if target user doesn't exist.
   */
  async proxyLogin(email: string, user: User) {
    if (user?.role !== Role.ADMIN) {
      throw {
        success: false,
        message: 'You are not authorized to perform proxy login.',
        status: HttpStatus.FORBIDDEN,
      };
    }

    const proxyUser = await this.usersService.findByEmail(email);
    if (!proxyUser) {
      throw {
        success: false,
        message: 'Target user not found.',
        status: HttpStatus.NOT_FOUND,
      };
    }

    const payload = {
      sub: proxyUser.id,
      email: proxyUser.email,
      role: proxyUser.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      user: {
        id: proxyUser.id,
        email: proxyUser.email,
        role: proxyUser.role,
      },
    };
  }

  /**
   * Issues new access and refresh tokens using a valid refresh token.
   *
   * @param refreshToken - JWT refresh token.
   * @returns Object with new tokens.
   * @throws Error if the token is invalid or tampered.
   */

  async refreshToken(refreshToken: string) {
    try {
      const decoded: JwtPayload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      const user = await this.usersService.findByEmail(decoded.email);
      if (!user || user.tokenVersion !== decoded.version) {
        throw new Error('Invalid token version');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        version: user.tokenVersion,
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '30m',
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: '7d',
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Logs out the user by incrementing the token version.
   * This will invalidate all existing tokens.
   *
   * @param user - Authenticated user object.
   * @returns Message indicating successful logout.
   */
  async logout(user: User) {
    await this.usersService.incrementTokenVersion(user.id); // force invalidate tokens
    return { message: 'Logged out from all devices.' };
  }
}
