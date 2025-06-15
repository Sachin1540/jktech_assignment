import { SetMetadata } from '@nestjs/common';
/**
 * A constant key used to store and retrieve role metadata.
 * This key is later used in custom guards (like RolesGuard) to check access permissions.
 */
export const ROLES_KEY = 'roles';
/**
 * A custom decorator that assigns roles metadata to route handlers (controllers or methods).
 * This metadata can be used by guards (e.g., RolesGuard) to allow or deny access based on user roles.
 *
 * @param roles - One or more strings representing valid user roles (e.g., 'admin', 'user', etc.)
 *
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
