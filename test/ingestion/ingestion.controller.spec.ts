import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from '../../src/ingestion/ingestion.controller';
import { IngestionService } from '../../src/ingestion/ingestion.service';
import { createRequest, createResponse } from 'node-mocks-http';
import { Role } from 'src/auth/dto/enum/roles.enum';

describe('IngestionController', () => {
  let controller: IngestionController;
  let mockIngestionService: any;

  beforeEach(async () => {
    mockIngestionService = {
      triggerIngestion: jest.fn(),
      getAllIngestionRuns: jest.fn(),
    };

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

  describe('webhookTrigger', () => {
    it('should return 401 if webhook token is missing or invalid', async () => {
      const req = createRequest({
        user: { id: 1, email: 'test@example.com', role: Role.USER },
      });
      const res = createResponse();

      await controller.webhookTrigger('invalid-token', res as any, req as any);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toMatchObject({
        message: 'Unauthorized: Invalid or missing webhook token',
      });
    });

    it('should return success if webhook token is valid', async () => {
      const req = createRequest({
        user: { id: 1, email: 'test@example.com', role: Role.USER },
      });
      const res = createResponse();

      mockIngestionService.triggerIngestion.mockResolvedValue({
        success: true,
        runId: 1,
        message: 'Completed',
      });

      await controller.webhookTrigger('valid-token', res as any, req as any);

      expect(mockIngestionService.triggerIngestion).toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: true,
        runId: 1,
      });
    });

    it('should return 500 if ingestion fails', async () => {
      const req = createRequest({
        user: { id: 1, email: 'test@example.com', role: Role.USER },
      });
      const res = createResponse();

      mockIngestionService.triggerIngestion.mockRejectedValue(
        new Error('DB error'),
      );

      await controller.webhookTrigger('valid-token', res as any, req as any);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        message: 'Webhook ingestion failed',
        error: 'DB error',
      });
    });
  });

  describe('getAllRuns', () => {
    it('should return ingestion runs', async () => {
      const res = createResponse();

      const mockRuns = [
        { id: 1, status: 'COMPLETED' },
        { id: 2, status: 'FAILED' },
      ];

      mockIngestionService.getAllIngestionRuns.mockResolvedValue(mockRuns);

      await controller.getAllRuns(res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockRuns);
    });
  });
});
