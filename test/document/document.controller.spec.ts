import { Test, TestingModule } from '@nestjs/testing';
import { DocumentController } from '../../src/document/document.controller';
import { DocumentService } from '../../src/document/document.service';
import { UpdateDocumentDto } from '../../src/document/dto/document.dto';

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

  describe('upload', () => {
    it('should upload document and return result', async () => {
      const file = {
        originalname: 'test.pdf',
        path: 'uploads/test.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const req = { user: { email: 'user@example.com' } } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const doc = { id: 1, filename: 'test.pdf' };
      mockDocumentService.uploadDocument.mockResolvedValue(doc);

      await controller.upload(file, req, res);
      expect(service.uploadDocument).toHaveBeenCalledWith(file, req.user);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(doc);
    });
  });

  describe('getAll', () => {
    it('should return all documents', async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const docs = [{ id: 1 }, { id: 2 }];
      mockDocumentService.findAll.mockResolvedValue(docs);
      await controller.getAll(res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(docs);
    });
  });

  describe('getOne', () => {
    it('should return a document by ID', async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
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
        title: 'Updated Title',
      };
      const req = { user: { id: 123 } } as any;
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
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;
      const result = { success: true, message: 'Document deleted' };
      mockDocumentService.delete.mockResolvedValue(result);
      await controller.delete(1, res);
      expect(service.delete).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });
});
