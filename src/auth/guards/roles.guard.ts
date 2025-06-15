import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
/**
 * Guard that restricts access to route handlers based on user roles.
 *
 * This guard checks for metadata set by the `@Roles()` decorator and compares it
 * against the role of the currently authenticated user.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  /**
   * Determines whether the current request can proceed based on the user's role.
   *
   * - Retrieves allowed roles using the `ROLES_KEY` metadata key.
   * - If no roles are defined, it allows the request (acts as a pass-through).
   * - Otherwise, it checks if the user's role matches any of the allowed roles.
   *
   * @param context - The current execution context, providing access to request and handler info.
   * @returns `true` if access is allowed, otherwise `false`.
   */
  canActivate(context: ExecutionContext): boolean {
    // Retrieve roles metadata from the handler and class level
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // If no roles are specified, allow access
    if (!roles) return true;
    // Extract user from request object
    const { user } = context.switchToHttp().getRequest();
    // Check if user's role is included in the allowed roles
    return roles.includes(user.role);
  }
}
