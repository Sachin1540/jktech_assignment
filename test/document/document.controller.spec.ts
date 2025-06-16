import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from '../../src/document/document.controller';
import { DocumentService } from '../../src/document/document.service';
import { UpdateDocumentDto } from '../../src/document/dto/document.dto';
import { createRequest, createResponse, MockRequest } from 'node-mocks-http';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';
import { PaginationDto } from 'src/common/pagination.dto';
import { Users } from 'src/users/user.entity';

const mockDocumentService = {
  uploadDocument: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateDocument: jest.fn(),
  delete: jest.fn(),
};

describe('DocumentController', () => {
  let controller: DocumentController;
  let service: DocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: mockDocumentService,
        },
      ],
    }).compile();

    controller = module.get<DocumentController>(DocumentController);
    service = module.get<DocumentService>(DocumentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const res = createResponse();
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();

  describe('upload', () => {
    it('should upload document and return result', async () => {
      const file = {
        originalname: 'test.pdf',
        path: 'uploads/test.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const mockUser = {
        id: 1,
        email: 'user@example.com',
        role: Role.ADMIN,
        password: 'dummyPassword',
        tokenVersion: 0,
      };
      const req = createRequest({
        user: mockUser,
      }) as MockRequest<AuthenticatedRequest>;

      const doc = { id: 1, filename: 'test.pdf' };
      mockDocumentService.uploadDocument.mockResolvedValue(doc);

      await controller.upload(file, req, res);
      expect(service.uploadDocument).toHaveBeenCalledWith(file, req.user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(doc);
    });
  });

  describe('getAll', () => {
    it('should return all documents with pagination', async () => {
      const docs = [{ id: 1 }, { id: 2 }];
      const query = { page: 1, limit: 10 };
      // const res = mockResponse();

      mockDocumentService.findAll.mockResolvedValue(docs);

      await controller.getAll(query, res);

      expect(mockDocumentService.findAll).toHaveBeenCalledWith(1, 10);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(docs);
    });

    it('should return 500 on error', async () => {
      // const res = mockResponse();
      const query = { page: 1, limit: 10 };
      const error = new Error('DB error');

      mockDocumentService.findAll.mockRejectedValue(error);

      await controller.getAll(query, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Failed to fetch documents',
        error: 'DB error',
      });
    });
  });

  describe('getOne', () => {
    it('should return a document by ID', async () => {
      const doc = { id: 1 };
      mockDocumentService.findOne.mockResolvedValue(doc);
      await controller.getOne(1, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(doc);
    });
  });

  describe('updateDocument', () => {
    it('should update document info', async () => {
      const file = {
        originalname: 'updated.pdf',
        path: 'uploads/updated.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const body: UpdateDocumentDto = {
        filename: 'Updated Title',
      };
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: Role.ADMIN,
        password: 'dummyPassword',
        tokenVersion: 0,
      };
      const req = createRequest({
        user: mockUser,
      }) as MockRequest<AuthenticatedRequest>;
      // const req = { user: { id: 123 } };
      const updatedDoc = { id: 1, ...body };

      mockDocumentService.updateDocument.mockResolvedValue(updatedDoc);

      const result = await controller.updateDocument(1, file, body, req);
      expect(service.updateDocument).toHaveBeenCalledWith(
        1,
        body,
        file,
        req.user,
      );
      expect(result).toEqual(updatedDoc);
    });
  });

  describe('delete', () => {
    it('should delete a document and return success message', async () => {
      const result = { success: true, message: 'Document deleted' };
      mockDocumentService.delete.mockResolvedValue(result);
      await controller.delete(1, res);
      expect(service.delete).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });
});
