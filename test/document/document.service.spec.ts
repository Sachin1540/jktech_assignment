import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from '../../src/document/document.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Document } from '../../src/document/entity/document.entity';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Users } from 'src/users/user.entity';

const mockDocumentRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});
const mockRepo = () => ({
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
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: getRepositoryToken(Document),
          useFactory: mockRepo,
        },
      ],
    }).compile();

    service = module.get(DocumentService);
    repo = module.get(getRepositoryToken(Document));
  });

  const mockFile = {
    originalname: 'test.pdf',
    path: 'uploads/test.pdf',
    mimetype: 'application/pdf',
    filename: 'test.pdf',
  } as Express.Multer.File;

  const mockUser = { id: 1 } as Users;

  describe('uploadDocument', () => {
    it('should create and save document successfully', async () => {
      const savedDoc = { id: 1, ...mockFile, uploadedBy: mockUser };
      repo.create.mockReturnValue(savedDoc);
      repo.save.mockResolvedValue(savedDoc);

      const result = await service.uploadDocument(mockFile, mockUser);

      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalledWith(savedDoc);
      expect(result).toEqual(savedDoc);
    });

    it('should throw InternalServerErrorException on error', async () => {
      repo.create.mockImplementation(() => {
        throw new Error('DB error');
      });

      await expect(service.uploadDocument(mockFile, mockUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all documents', async () => {
      const docs = [{ id: 1 }, { id: 2 }];
      repo.find.mockResolvedValue(docs);

      expect(await service.findAll()).toEqual(docs);
    });
  });

  describe('findOne', () => {
    it('should return the document if found', async () => {
      const doc = { id: 1 };
      repo.findOneBy.mockResolvedValue(doc);

      expect(await service.findOne(1)).toEqual(doc);
    });

    it('should throw NotFoundException if document not found', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return updated document', async () => {
      const updated = { id: 1 };
      repo.update.mockResolvedValue({});
      repo.findOneBy.mockResolvedValue(updated);

      const result = await service.update(1, { filename: 'Updated' });

      expect(repo.update).toHaveBeenCalledWith(1, { filename: 'Updated' });

      expect(result).toEqual(updated);
    });
  });

  describe('updateDocument', () => {
    it('should update metadata and file info', async () => {
      const existingDoc = { id: 1 };
      const updatedDoc = {
        ...existingDoc,

        filename: mockFile.filename,
        path: mockFile.path,
        mimetype: mockFile.mimetype,
        updatedBy: mockUser,
      };

      repo.findOne.mockResolvedValue(existingDoc);
      repo.save.mockResolvedValue(updatedDoc);

      const result = await service.updateDocument(
        1,
        { filename: 'New' },
        mockFile,
        mockUser,
      );

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(repo.save).toHaveBeenCalledWith(updatedDoc);
      expect(result).toEqual(updatedDoc);
    });

    it('should throw NotFoundException if document not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.updateDocument(1, {}, mockFile, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete document and return success message', async () => {
      const mockDocument = { id: 1, title: 'Test Doc' };

      repo.findOneBy.mockResolvedValue(mockDocument);
      repo.delete.mockResolvedValue({});

      const result = await service.delete(1);

      expect(repo.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(repo.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true, message: 'Document deleted' });
    });
  });
});
