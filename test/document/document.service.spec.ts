import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from '../../src/document/document.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document } from '../../src/document/entity/document.entity';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

const mockDocumentRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('DocumentService', () => {
  let service: DocumentService;
  let repo: jest.Mocked<Repository<Document>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(Document),
          useFactory: mockDocumentRepo,
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    repo = module.get(getRepositoryToken(Document));
  });

  describe('uploadDocument', () => {
    it('should upload and save a document', async () => {
      const file: any = {
        originalname: 'test.pdf',
        path: 'uploads/test.pdf',
        mimetype: 'application/pdf',
      };
      const user = { email: 'test@example.com' };
      const savedDoc = { id: 1, ...file, uploadedBy: user.email };

      repo.create.mockReturnValue(savedDoc);
      repo.save.mockResolvedValue(savedDoc);

      const result = await service.uploadDocument(file, user);
      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(savedDoc);
      expect(result).toEqual(savedDoc);
    });

    it('should throw InternalServerErrorException on error', async () => {
      repo.create.mockImplementation(() => {
        throw new Error();
      });
      await expect(service.uploadDocument({} as any, {})).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const docs: any = [{ id: 1 }, { id: 2 }];
      repo.find.mockResolvedValue(docs);
      const result = await service.findAll();
      expect(result).toEqual(docs);
    });
  });

  describe('findOne', () => {
    it('should return a document by id', async () => {
      const doc: any = { id: 1 };
      repo.findOneBy.mockResolvedValue(doc);
      const result = await service.findOne(1);
      expect(result).toEqual(doc);
    });

    it('should throw NotFoundException if doc not found', async () => {
      repo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the document', async () => {
      const updatedDoc: any = { id: 1 };
      //   repo.update.mockResolvedValue(undefined);
      repo.findOneBy.mockResolvedValue(updatedDoc);
      const result = await service.update(1, { filename: 'updated.pdf' });
      expect(result).toEqual(updatedDoc);
    });
  });

  describe('updateDocument', () => {
    it('should update the document with new file and fields', async () => {
      const existingDoc = { id: 1, filename: 'old.pdf' } as Document;
      const file = {
        filename: 'new.pdf',
        path: 'uploads/new.pdf',
        mimetype: 'application/pdf',
      } as any;
      const dto: any = { someField: 'value' };
      const user = { id: 123 };

      repo.findOne.mockResolvedValue(existingDoc);
      repo.save.mockResolvedValue({
        ...existingDoc,
        ...dto,
        ...file,
        updatedBy: user.id,
      });

      const result = await service.updateDocument(1, dto, file, user);
      expect(result.updatedBy).toEqual(user.id);
    });

    it('should throw NotFoundException if doc not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.updateDocument(1, {}, undefined, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a document and return success message', async () => {
      repo.delete.mockResolvedValue({ affected: 1 } as any);
      const result = await service.delete(1);
      expect(result).toEqual({ success: true, message: 'Document deleted' });
    });
  });
});
