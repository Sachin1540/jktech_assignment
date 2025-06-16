import { Role } from 'src/auth/dto/enum/roles.enum';
import { User } from 'src/users/user.entity';

/**
 * Interface extending the base Express Request object to include authenticated user information.
 *
 * This interface is used throughout the application where request context involves
 * an authenticated user. It helps provide strong typing for `req.user`, improving
 * type safety and IntelliSense support during development.
 *
 */
export interface AuthenticatedRequest extends Request {
  /**
   * The currently authenticated user object.
   * Injected by the authentication guard after verifying the JWT token.
   */
  user: User;
}
