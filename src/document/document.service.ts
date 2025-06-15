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

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepo: Repository<Document>,
  ) {}

  async uploadDocument(file: Express.Multer.File, uploadedBy: any) {
    try {
      const doc = this.documentRepo.create({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        uploadedBy: uploadedBy?.email,
      });
      return await this.documentRepo.save(doc);
    } catch (error) {
      this.logger.error('Failed to upload document', error);
      throw new InternalServerErrorException('Failed to upload document');
    }
  }

  async findAll() {
    return this.documentRepo.find();
  }

  async findOne(id: number) {
    const doc = await this.documentRepo.findOneBy({ id });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async update(id: number, update: Partial<Document>) {
    await this.documentRepo.update(id, update);
    return this.findOne(id);
  }
  async updateDocument(
    id: number,
    dto: UpdateDocumentDto,
    file?: Express.Multer.File,
    user?: any,
  ) {
    const document = await this.documentRepo.findOne({ where: { id } });
    if (!document) throw new NotFoundException('Document not found');

    Object.assign(document, dto);

    if (file) {
      document.filename = file.filename;
      document.path = file.path;
      document.mimetype = file.mimetype;
    }

    document.updatedBy = user.id;

    return this.documentRepo.save(document);
  }

  async delete(id: number) {
    await this.documentRepo.delete(id);
    return { success: true, message: 'Document deleted' };
  }
}
