/**
 * Interface representing the response structure for an ingestion process.
 *
 * This response is returned after the ingestion has been triggered and completed,
 * providing details about the execution result, including success status,
 * user-friendly message, ingestion run ID, and a summary of the result.
 */
export interface IngestionResponse {
  success: boolean;
  message: string;
  runId: number;
  summary: {
    totalCount: number;
    successCount: number;
    failCount: number;
    status: string;
  };
}

export interface JKTechCarrers {
  reqId: number;
  reqTitle: string;
  employmentType: string;
}
