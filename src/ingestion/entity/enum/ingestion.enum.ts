/**
 * Enum representing the possible statuses of the ingestion process.
 *
 * This enum is used to track and manage the state of ingestion tasks,
 * and can be useful for status checks, logs, and conditional logic in the application.
 */
export enum Ingestion_Status {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
