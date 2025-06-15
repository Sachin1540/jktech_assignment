import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard is a custom guard that uses the 'local' strategy.
 * 
 * It is typically used during the login process, where a user provides
 * credentials (like email and password) that are validated by the
 * LocalStrategy.
 *
 * This guard is used on the login route to validate user credentials
 * before proceeding to issue a JWT.
 *
 * Usage:
 * @UseGuards(LocalAuthGuard)
 * async login(@Req() req) {
 *   return this.authService.login(req.user);
 * }
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
