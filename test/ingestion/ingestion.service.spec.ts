import { Users } from 'src/users/user.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { IngestionService } from 'src/ingestion/ingestion.service';
import { Ingestion } from 'src/ingestion/entity/ingestion.entity';
import { IngestionRun } from 'src/ingestion/entity/ingestionrun.entity';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('IngestionService', () => {
  let service: IngestionService;
  let ingestionRepo: jest.Mocked<Repository<Ingestion>>;
  let runRepo: jest.Mocked<Repository<IngestionRun>>;

  const mockUser: Users = {
    id: 1,
    email: 'test@example.com',
    role: 'USER',
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        {
          provide: getRepositoryToken(Ingestion),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(IngestionRun),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(IngestionService);
    ingestionRepo = module.get(getRepositoryToken(Ingestion));
    runRepo = module.get(getRepositoryToken(IngestionRun));
  });

  describe('triggerIngestion', () => {
    const mockReqList = [
      {
        reqId: 'REQ123',
        reqTitle: 'Software Engineer',
        employmentType: 'Full-Time',
      },
    ];

    beforeEach(() => {
      runRepo.create.mockReturnValue({ id: 1, createdBy: mockUser } as any);
      runRepo.save.mockImplementation((val: IngestionRun) =>
        Promise.resolve(val),
      );
    });

    it('should complete ingestion successfully', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { reqDetailsBOList: mockReqList },
      });
      ingestionRepo.findOne.mockResolvedValue(null);
      ingestionRepo.create.mockImplementation((val: Ingestion) => val);
      ingestionRepo.save.mockImplementation((val: Ingestion) =>
        Promise.resolve(val),
      );

      const result = await service.triggerIngestion(mockUser);

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.summary.totalCount).toBe(1);
      expect(result.summary.successCount).toBe(1);
      expect(result.summary.failCount).toBe(0);
    });

    it('should skip duplicate entries', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { reqDetailsBOList: mockReqList },
      });
      ingestionRepo.findOne.mockResolvedValue({ id: 1 } as any); // simulate existing reqId

      const result = await service.triggerIngestion(mockUser);

      expect(result.summary.totalCount).toBe(1);
      expect(result.summary.successCount).toBe(0);
      expect(result.summary.failCount).toBe(0);
    });
    it('should throw InternalServerErrorException if API call fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API failure'));
      const mockIngestionRun: IngestionRun = {
        id: 1,
        status: 'IN_PROGRESS',
        totalCount: 0,
        successCount: 0,
        failCount: 0,
        createdAt: new Date(),
        createdBy: mockUser,
        completedAt: new Date(),
      };

      runRepo.create.mockReturnValue(mockIngestionRun);
      runRepo.save.mockResolvedValue(mockIngestionRun);

      await expect(service.triggerIngestion(mockUser)).rejects.toThrow(
        'Ingestion failed',
      );

      expect(runRepo.save).toHaveBeenCalledTimes(2); // 1st: initial save, 2nd: failed run status update
    });

    // it('should handle external API failure', async () => {
    //   mockedAxios.post.mockRejectedValue(new Error('API failure'));

    //   await expect(service.triggerIngestion(mockUser)).rejects.toThrow(
    //     InternalServerErrorException,
    //   );
    //   expect(runRepo.save).toHaveBeenCalled(); // run should still be marked as FAILED
    // });
    it('should increment failCount on ingestion save error', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { reqDetailsBOList: mockReqList },
      });

      ingestionRepo.findOne.mockResolvedValue(null);
      ingestionRepo.create.mockImplementation((val: Ingestion) => val);

      // Simulate save failure only for the first save (inside try block)
      ingestionRepo.save
        // .mockImplementationOnce(() => Promise.resolve({})) // first save (record before try)
        .mockImplementationOnce(() =>
          Promise.reject(new Error('DB save failed')),
        ) // second save (after try)
        .mockImplementation((val: Ingestion) => Promise.resolve(val)); // subsequent saves

      const result = await service.triggerIngestion(mockUser);

      expect(result.summary.failCount).toBe(1);
      expect(result.summary.successCount).toBe(0);
    });

    // it('should increment failCount on ingestion save error', async () => {
    //   mockedAxios.post.mockResolvedValue({
    //     data: { reqDetailsBOList: mockReqList },
    //   });
    //   ingestionRepo.findOne.mockResolvedValue(null);
    //   ingestionRepo.create.mockImplementation((val: Ingestion) => val);
    //   let call = 0;
    //   ingestionRepo.save.mockImplementation((val: Ingestion) => {
    //     // simulate first save success, second fails
    //     if (call++ === 0) return Promise.resolve(val);
    //     else throw new Error('DB save failed');
    //   });

    //   const result = await service.triggerIngestion(mockUser);

    //   expect(result.summary.failCount).toBe(1);
    // });
  });

  describe('getAllIngestionRuns', () => {
    it('should return all ingestion runs sorted by createdAt DESC', async () => {
      const mockRuns = [{ id: 1 }, { id: 2 }] as any;
      runRepo.find.mockResolvedValue(mockRuns);

      const result = await service.getAllIngestionRuns();
      expect(result).toEqual(mockRuns);
      expect(runRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });
  });
});
