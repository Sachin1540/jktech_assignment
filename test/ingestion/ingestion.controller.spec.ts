import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from '../../src/ingestion/ingestion.controller';
import { IngestionService } from '../../src/ingestion/ingestion.service';
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse,
} from 'node-mocks-http';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { Response } from 'express';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';
import { Ingestion_Status } from 'src/ingestion/entity/enum/ingestion.enum';
import { IngestionRun } from 'src/ingestion/entity/ingestionrun.entity';
import { User } from 'src/users/user.entity';

describe('IngestionController', () => {
  let controller: IngestionController;
  let mockIngestionService: jest.Mocked<IngestionService>;

  beforeEach(async () => {
    mockIngestionService = {
      triggerIngestion: jest.fn(),
      getAllIngestionRuns: jest.fn(),
    } as unknown as jest.Mocked<IngestionService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        {
          provide: IngestionService,
          useValue: mockIngestionService,
        },
      ],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
    process.env.WEBHOOK_SECRET = 'valid-token';
  });
  const res = createResponse() as MockResponse<Response>;

  describe('webhookTrigger', () => {
    it('should return 401 if webhook token is missing or invalid', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: Role.USER };
      const req = createRequest({
        user: mockUser,
      }) as MockRequest<AuthenticatedRequest>;

      await controller.webhookTrigger('invalid-token', res, req);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toMatchObject({
        message: 'Unauthorized: Invalid or missing webhook token',
      });
    });

    it('should return success if webhook token is valid', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: Role.USER,
        password: 'dummyPassword',
        tokenVersion: 0,
      };

      const req = createRequest({
        user: mockUser,
      }) as MockRequest<AuthenticatedRequest>;

      mockIngestionService.triggerIngestion.mockResolvedValue({
        success: true,
        runId: 1,
        message: Ingestion_Status.COMPLETED,
        summary: {
          totalCount: 100,
          successCount: 95,
          failCount: 5,
          status: Ingestion_Status.COMPLETED,
        },
      });

      await controller.webhookTrigger('valid-token', res, req);

      expect(mockIngestionService.triggerIngestion).toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: true,
        runId: 1,
      });
    });

    it('should return 500 if ingestion fails', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: Role.USER,
        password: 'dummyPassword',
        tokenVersion: 0,
      };

      const req = createRequest({
        user: mockUser,
      }) as MockRequest<AuthenticatedRequest>;

      mockIngestionService.triggerIngestion.mockRejectedValue(
        new Error('DB error'),
      );

      await controller.webhookTrigger('valid-token', res, req);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        message: 'Webhook ingestion failed',
        error: 'DB error',
      });
    });
  });

  describe('getAllRuns', () => {
    it('should return ingestion runs', async () => {
      const mockUser = { id: 1 } as User;
      const mockRuns: IngestionRun[] = [
        {
          id: 1,
          status: Ingestion_Status.COMPLETED,
          totalCount: 10,
          successCount: 10,
          failCount: 0,
          createdBy: mockUser,
          createdAt: new Date(),
          completedAt: new Date(),
        },
        {
          id: 1,
          status: Ingestion_Status.FAILED,
          totalCount: 10,
          successCount: 0,
          failCount: 10,
          createdBy: mockUser,
          createdAt: new Date(),
          completedAt: new Date(),
        },
      ];

      mockIngestionService.getAllIngestionRuns.mockResolvedValue(mockRuns);

      await controller.getAllRuns(res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockRuns);
    });
  });
});
