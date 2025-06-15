import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import axios from 'axios';
import { InternalServerErrorException } from '@nestjs/common';
import { IngestionService } from 'src/ingestion/ingestion.service';
import { Ingestion } from 'src/ingestion/entity/ingestion.entity';
import { IngestionRun } from 'src/ingestion/entity/ingestionrun.entity';

jest.mock('axios');

const mockIngestionRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockIngestionRunRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});

describe('IngestionService', () => {
  let service: IngestionService;
  let ingestionRepo: ReturnType<typeof mockIngestionRepo>;
  let ingestionRunRepo: ReturnType<typeof mockIngestionRunRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: getRepositoryToken(Ingestion),
          useFactory: mockIngestionRepo,
        },
        {
          provide: getRepositoryToken(IngestionRun),
          useFactory: mockIngestionRunRepo,
        },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
    ingestionRepo = module.get(getRepositoryToken(Ingestion));
    ingestionRunRepo = module.get(getRepositoryToken(IngestionRun));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = { id: 1, email: 'test@example.com' };

  describe('triggerIngestion', () => {
    it('should ingest data successfully', async () => {
      const mockRun = { id: 123, status: 'IN_PROGRESS' };
      const mockReqList = [
        { reqId: '1', reqTitle: 'Engineer', employmentType: 'Full-time' },
        { reqId: '2', reqTitle: 'Analyst', employmentType: 'Contract' },
      ];

      ingestionRunRepo.create.mockReturnValue(mockRun);
      ingestionRunRepo.save.mockResolvedValue(mockRun);

      (axios.post as jest.Mock).mockResolvedValue({
        data: { reqDetailsBOList: mockReqList },
      });

      ingestionRepo.findOne.mockResolvedValue(null);
      ingestionRepo.create.mockImplementation((x) => x);
      ingestionRepo.save.mockResolvedValue({});

      const result = await service.triggerIngestion(mockUser);

      expect(result.success).toBe(true);
      expect(result.summary.totalCount).toBe(2);
      expect(ingestionRunRepo.save).toHaveBeenCalledTimes(2); // initial, during processing, final
    });

    it('should handle ingestion errors from axios', async () => {
      ingestionRunRepo.create.mockReturnValue({ id: 1 });
      ingestionRunRepo.save.mockResolvedValue({});

      (axios.post as jest.Mock).mockRejectedValue(new Error('axios error'));

      await expect(service.triggerIngestion(mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(ingestionRunRepo.save).toHaveBeenCalledTimes(2); // initial and failure update
    });
  });

  describe('getAllIngestionRuns', () => {
    it('should return all ingestion runs', async () => {
      const mockRuns = [{ id: 1 }, { id: 2 }];
      ingestionRunRepo.find.mockResolvedValue(mockRuns);

      const result = await service.getAllIngestionRuns();
      expect(result).toEqual(mockRuns);
      expect(ingestionRunRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });
});
