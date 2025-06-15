import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IngestionRun } from './ingestionrun.entity';
import { Ingestion_Status } from './enum/ingestion.enum';
import { User } from 'src/users/user.entity';

/**
 * Entity representing an ingestion job.
 *
 * This entity stores metadata about individual ingestion requests,
 * including status, ownership, and associated run context.
 */
@Entity()
export class Ingestion {
  /**
   * Primary auto-generated ID for the ingestion job.
   */
  @PrimaryGeneratedColumn()
  jobid: number;

  /**
   * Unique request ID for the ingestion job.
   */
  @Column({ unique: true })
  reqId: number;

  /**
   * Title or description of the ingestion job.
   */
  @Column()
  title: string;

  /**
   * Employment type associated with the job data (e.g., Full-Time, Contract).
   */
  @Column()
  employmentType: string;

  /**
   * Flag indicating if the ingestion job is currently active.
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Status of the ingestion job (e.g., IN_PROGRESS, COMPLETED, FAILED).
   */
  @Column({ default: Ingestion_Status.IN_PROGRESS })
  status: string;

  /**
   * Error message if the ingestion process fails.
   */
  @Column({ nullable: true })
  errorMessage: string;

  /**
   * Reference to the parent ingestion run entity.
   * Allows tracking of which run this job belongs to.
   */
  @ManyToOne(() => IngestionRun, { nullable: true, cascade: true })
  ingestionRun: IngestionRun;

  /**
   * User who created the ingestion job.
   */
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  /**
   * User who last updated the ingestion job.
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedBy: User;

  /**
   * Timestamp when the ingestion job was created.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the ingestion job was last updated.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
