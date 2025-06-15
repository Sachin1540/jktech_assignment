import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ingestion_Status } from './enum/ingestion.enum';

/**
 * Entity representing a single run of the ingestion process.
 *
 * This entity holds summary information about an ingestion run,
 * including status and result counts.
 */
@Entity()
export class IngestionRun {
  /**
   * Primary auto-generated ID for the ingestion run.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Current status of the ingestion run.
   * Default is 'IN_PROGRESS'. Other possible values: 'COMPLETED', 'FAILED'.
   */
  @Column({ default: Ingestion_Status.IN_PROGRESS })
  status: string;

  /**
   * Total number of records to be ingested in this run.
   */
  @Column({ default: 0 })
  totalCount: number;

  /**
   * Number of records successfully ingested.
   */
  @Column({ default: 0 })
  successCount: number;

  /**
   * Number of records that failed during ingestion.
   */
  @Column({ default: 0 })
  failCount: number;

  /**
   * ID of the user who initiated the ingestion run.
   */
  @Column()
  createdBy: number;

  /**
   * Timestamp when the ingestion run was created.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the ingestion run was last updated or completed.
   */
  @UpdateDateColumn()
  completedAt: Date;
}
