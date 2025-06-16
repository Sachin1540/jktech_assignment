import { Users } from 'src/users/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

/**
 * Document entity representing a document record in the database.
 * Stores metadata about uploaded documents and tracks which user uploaded or last updated them.
 */
@Entity()
export class Document {
  /**
   * Unique identifier for the document.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Original name of the uploaded file.
   */
  @Column()
  filename: string;

  /**
   * Path to the file stored on disk or in cloud storage.
   */
  @Column()
  path: string;

  /**
   * MIME type of the file (e.g., 'application/pdf').
   */
  @Column()
  mimetype: string;

  /**
   * User who uploaded the document.
   */
  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'uploadedBy' })
  uploadedBy: Users;

  /**
   * Users who last updated the document.
   */
  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: Users;

  /**
   * Timestamp when the document was created.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the document was last updated.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
