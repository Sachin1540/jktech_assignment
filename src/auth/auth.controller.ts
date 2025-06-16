import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { LoginDTO, RefreshTokenDto } from './dto/auth-dto';
import { Role } from './dto/enum/roles.enum';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Handles user login using email and password.
   * Protected by LocalAuthGuard which validates credentials.
   *
   * @param req - The request object containing user credentials.
   * @param res - The response object for sending status and token.
   */
  @Post('login')
  @ApiBody({ type: LoginDTO })
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'User login with email and password' })
  async login(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      const result = await this.authService.login(req.user);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Login failed', error });
    }
  }

  /**
   * Allows an admin to proxy login as another user using their email.
   * Protected by JWT + RolesGuard; only accessible by users with ADMIN role.
   *
   * @param req - The authenticated admin request.
   * @param res - The response object.
   * @param params - Parameters containing the target user's email.
   */
  @Get('admin-proxy/:email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin login as another user' })
  @ApiParam({ name: 'email', required: true, description: 'Target email' })
  async adminProxy(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param() params,
  ) {
    try {
      const result = await this.authService.proxyLogin(
        params.email.toLowerCase(),
        req.user,
      );
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Admin proxy failed', error });
    }
  }

  /**
   * Refreshes the access and refresh tokens using a valid refresh token.
   * Protected by JWT + RolesGuard to ensure only valid users can refresh.
   *
   * @param token - The refresh token provided in the request body.
   * @param res - The response object to return new tokens or error.
   */
  @Post('refresh')
  @ApiBody({ type: RefreshTokenDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  async refresh(@Body('refreshToken') token: string, @Res() res: Response) {
    if (!token) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    try {
      const tokens = await this.authService.refreshToken(token);
      return res.status(200).json(tokens);
    } catch (error) {
      return res.status(403).json({ message: error.message });
    }
  }

  /**
   * Logs out the current authenticated user.
   * Protected by JWT guard.
   *
   * @param req - The authenticated request containing user info.
   * @param res - The response object to confirm logout or return an error.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout current user' })
  async logout(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      const result = await this.authService.logout(req.user);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Logout failed', error });
    }
  }
}
