import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Ingestion } from './entity/ingestion.entity';
import { Repository } from 'typeorm';
import { IngestionRun } from './entity/ingestionrun.entity';
import { User } from 'src/users/user.entity';
import { IngestionResponse, JKTechCarrers } from './types/ingestion.interface';
import { Ingestion_Status } from './entity/enum/ingestion.enum';

/**
 * Service responsible for handling the ingestion logic.
 *
 * This service triggers the ingestion of data from an external source,
 * processes and saves records in the local database,
 * and logs metadata about each ingestion run.
 */
@Injectable()
export class IngestionService {
  constructor(
    @InjectRepository(Ingestion)
    private ingestionRepository: Repository<Ingestion>,

    @InjectRepository(IngestionRun)
    private ingestionRunRepository: Repository<IngestionRun>,
  ) {}

  private readonly logger = new Logger(IngestionService.name);

  /**
   * Triggers the ingestion process for external data.
   *
   * - Creates a new ingestion run entry
   * - Calls an external API to fetch data
   * - Deduplicates based on `reqId`
   * - Saves new data to the database with appropriate status
   * - Updates the ingestion run summary with success/failure counts
   *
   * @param user - The user initiating the ingestion
   * @returns An object with ingestion summary
   * @throws InternalServerErrorException if ingestion fails
   */
  async triggerIngestion(user: User): Promise<IngestionResponse> {
    this.logger.log(`Ingestion triggered by user: ${user.email}`);

    const body = {
      source: 'careers',
      code: '',
      filterByBuId: -1,
    };

    // Step 1: Create IngestionRun record
    const ingestionRun = this.ingestionRunRepository.create({
      status: Ingestion_Status.IN_PROGRESS,
      createdBy: user,
      totalCount: 0,
    });
    await this.ingestionRunRepository.save(ingestionRun);

    try {
      // Step 2: Fetch data from external source
      const response = await axios.post(
        'https://jktech.mynexthire.com/employer/careers/reqlist/get',
        body,
      );
      const result = response.data;

      let successCount = 0;
      let failCount = 0;
      let totalCount = result?.reqDetailsBOList?.length || 0;

      // Process each item
      if (totalCount > 0) {
        await Promise.all(
          result.reqDetailsBOList.map(async (data: JKTechCarrers) => {
            const existing = await this.ingestionRepository.findOne({
              where: { reqId: data.reqId },
            });

            if (!existing) {
              const newRecord = this.ingestionRepository.create({
                reqId: data.reqId,
                title: data.reqTitle,
                employmentType: data.employmentType,
                status: Ingestion_Status.IN_PROGRESS,
                createdBy: user,
                ingestionRun: ingestionRun,
              });

              try {
                await this.ingestionRepository.save(newRecord);
                newRecord.status = Ingestion_Status.COMPLETED;
                successCount++;
              } catch (err) {
                newRecord.status = Ingestion_Status.FAILED;
                newRecord.errorMessage = err.message;
                failCount++;
              }

              // Save record with final status
              await this.ingestionRepository.save(newRecord);
            }
          }),
        );
      }

      // Step 3: Update the ingestion run record
      ingestionRun.status =
        failCount > 0 ? Ingestion_Status.FAILED : Ingestion_Status.COMPLETED;
      ingestionRun.totalCount = totalCount;
      ingestionRun.successCount = successCount;
      ingestionRun.failCount = failCount;
      ingestionRun.completedAt = new Date();

      await this.ingestionRunRepository.save(ingestionRun);
      await this.simulateIngestion();

      return {
        success: true,
        message: 'Ingestion completed successfully.',
        runId: ingestionRun.id,
        summary: {
          totalCount,
          successCount,
          failCount,
          status: ingestionRun.status,
        },
      };
    } catch (error) {
      // Handle ingestion errors
      this.logger.error('Ingestion failed:', error);

      ingestionRun.status = Ingestion_Status.FAILED;
      ingestionRun.completedAt = new Date();
      await this.ingestionRunRepository.save(ingestionRun);

      throw new InternalServerErrorException('Ingestion failed');
    }
  }

  /**
   * Retrieves all ingestion runs sorted by creation date in descending order.
   *
   * @returns A list of all ingestion runs
   */
  async getAllIngestionRuns(): Promise<IngestionRun[]> {
    return this.ingestionRunRepository.find({ order: { createdAt: 'DESC' } });
  }

  /**
   * Simulates a long-running ingestion process for testing/logging purposes.
   * Used here as a placeholder to imitate processing delay.
   */
  private async simulateIngestion() {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.logger.log('Ingestion process completed.');
  }
}
