import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entity/document.entity';
import { UpdateDocumentDto } from './dto/document.dto';
import { Users } from 'src/users/user.entity';
/**
 * Service for managing document operations such as uploading,
 * retrieving, updating, and deleting documents.
 */
@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepo: Repository<Document>,
  ) {}
  /**
   * Uploads a new document to the database.
   * @param file The uploaded file.
   * @param uploadedBy The user uploading the document.
   * @returns The saved document entity.
   * @throws InternalServerErrorException if saving fails.
   */
  async uploadDocument(file: Express.Multer.File, uploadedBy: Users) {
    try {
      const doc = this.documentRepo.create({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        uploadedBy: { id: uploadedBy.id }, // Fix here
      });
      return await this.documentRepo.save(doc);
    } catch (error) {
      console.log('error: ', error);
      this.logger.error('Failed to upload document', error);
      throw new InternalServerErrorException('Failed to upload document');
    }
  }
  /**
   * Retrieves all documents from the database.
   * @returns An array of document entities.
   */
  async findAll() {
    return this.documentRepo.find();
  }
  /**
   * Retrieves a document by its ID.
   * @param id The ID of the document.
   * @returns The document entity.
   * @throws NotFoundException if no document is found.
   */
  async findOne(id: number) {
    const doc = await this.documentRepo.findOneBy({ id });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }
  /**
   * Updates a document's basic fields by ID.
   * @param id The ID of the document.
   * @param update Partial document fields to update.
   * @returns The updated document entity.
   */
  async update(id: number, update: Partial<Document>) {
    await this.findOne(id); // Ensures the document exists or throws NotFoundException
    await this.documentRepo.update(id, update);
    return this.findOne(id);
  }
  /**
   * Updates a document, optionally replacing the file and metadata.
   * @param id The ID of the document.
   * @param dto Metadata fields to update.
   * @param file New uploaded file (optional).
   * @param user The user performing the update.
   * @returns The updated document entity.
   * @throws NotFoundException if the document does not exist.
   */
  async updateDocument(
    id: number,
    dto: UpdateDocumentDto,
    file: Express.Multer.File,
    user: Users,
  ) {
    const document = await this.documentRepo.findOne({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');

    Object.assign(document, dto);

    if (file) {
      document.filename = file.filename;
      document.path = file.path;
      document.mimetype = file.mimetype;
    }

    document.updatedBy = user;

    return this.documentRepo.save(document);
  }
  /**
   * Deletes a document by ID.
   * @param id The ID of the document to delete.
   * @returns A success response object.
   */
  async delete(id: number) {
    await this.findOne(id); // Ensures the document exists or throws NotFoundException
    await this.documentRepo.delete(id);
    return { success: true, message: 'Document deleted' };
  }
}
