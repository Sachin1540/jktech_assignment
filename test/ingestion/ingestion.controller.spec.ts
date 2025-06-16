import { Test, TestingModule } from '@nestjs/testing';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';
import { Response } from 'express';
import { IngestionController } from 'src/ingestion/ingestion.controller';
import { IngestionService } from 'src/ingestion/ingestion.service';
import * as httpMocks from 'node-mocks-http';
import { PaginationDto } from 'src/common/pagination.dto';

const mockIngestionService = {
  triggerIngestion: jest.fn(),
  getAllIngestionRuns: jest.fn(),
};

describe('IngestionController', () => {
  let controller: IngestionController;
  let service: IngestionService;

  const mockRes = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        { provide: IngestionService, useValue: mockIngestionService },
      ],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
    service = module.get<IngestionService>(IngestionService);
  });

  it('should trigger ingestion with valid token', async () => {
    const user = { id: 1, email: 'user@example.com', role: Role.USER };
    const req = { user } as AuthenticatedRequest;
    const res = mockRes();
    const mockResult = { success: true };

    process.env.WEBHOOK_SECRET = 'valid-token';
    mockIngestionService.triggerIngestion.mockResolvedValue(mockResult);

    await controller.webhookTrigger('valid-token', res, req);

    expect(service.triggerIngestion).toHaveBeenCalledWith(user);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockResult);
  });
  it('should return 401 for invalid webhook token', async () => {
    const req = { user: { id: 1, role: Role.USER } } as AuthenticatedRequest;
    const res = mockRes();

    process.env.WEBHOOK_SECRET = 'valid-token';

    await controller.webhookTrigger('invalid-token', res, req);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Unauthorized: Invalid or missing webhook token',
    });
  });
  it('should return 500 if ingestion service throws', async () => {
    const req = { user: { id: 1, role: Role.USER } } as AuthenticatedRequest;
    const res = mockRes();

    process.env.WEBHOOK_SECRET = 'valid-token';
    mockIngestionService.triggerIngestion.mockRejectedValue(new Error('Boom'));

    await controller.webhookTrigger('valid-token', res, req);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Webhook ingestion failed',
      error: 'Boom',
    });
  });
  it('should return all ingestion runs with status 200', async () => {
    const res = httpMocks.createResponse();
    const query: PaginationDto = { page: 1, limit: 10 };

    await controller.getAllRuns(query, res as any);

    expect(mockIngestionService.getAllIngestionRuns).toHaveBeenCalledWith(
      1,
      10,
    );
    expect(res._getStatusCode()).toBe(200);
  });
});
