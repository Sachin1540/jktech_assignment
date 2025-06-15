import { Role } from 'src/auth/dto/enum/roles.enum';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * User entity representing a user record in the database.
 */
@Entity()
export class User {
  /**
   * Primary key - auto-generated user ID.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * User email address.
   * Must be unique across all users.
   */
  @Column({ unique: true })
  email: string;

  /**
   * User password (hashed).
   */
  @Column()
  password: string;

  /**
   * Role assigned to the user (ADMIN, USER, or VIEWER).
   * Defaults to USER.
   */
  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  /**
   * Token version used for invalidating old refresh tokens.
   * Defaults to 0 and increments on logout or password change.
   */
  @Column({ default: 0 })
  tokenVersion: number;
}
