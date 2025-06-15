import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
/**
 * JwtAuthGuard is a custom guard that extends NestJS's AuthGuard
 * using the 'jwt' strategy.
 *
 * It ensures that any route it's applied to is protected and
 * can only be accessed with a valid JWT token.
 *
 * Usage:
 * @UseGuards(JwtAuthGuard)
 * apply this decorator on any controller method to secure it.
 */
export class JwtAuthGuard extends AuthGuard('jwt') {}
