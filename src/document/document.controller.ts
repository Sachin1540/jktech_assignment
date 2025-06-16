/**
 * Controller for handling document-related operations such as
 * uploading, retrieving, updating, and deleting documents.
 */
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  Param,
  Body,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentService } from './document.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response, Request } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateDocumentDto } from './dto/document.dto';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';

@ApiTags('Document')
@Controller('documents')
@ApiBearerAuth('access-token')
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  /**
   * Uploads a document file.
   * Requires authentication and appropriate user role.
   * @param file The uploaded file.
   * @param req Authenticated request containing the user.
   * @param res HTTP response object.
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a document' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    try {
      const result = await this.documentService.uploadDocument(file, req.user);
      res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to upload document',
        error: error.message || error,
      });
    }
  }

  /**
   * Retrieves all documents.
   * Requires authentication and appropriate role.
   * @param res HTTP response object.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({ summary: 'Get all documents' })
  async getAll(@Res() res: Response) {
    try {
      const result = await this.documentService.findAll();
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to fetch documents',
        error: error.message || error,
      });
    }
  }

  /**
   * Retrieves a specific document by ID.
   * @param id Document ID.
   * @param res HTTP response object.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID' })
  async getOne(@Param('id') id: number, @Res() res: Response) {
    try {
      const result = await this.documentService.findOne(id);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.NOT_FOUND).json({
        message: 'Document not found',
        error: error.message || error,
      });
    }
  }

  /**
   * Updates document details and optionally replaces the file.
   * @param id Document ID.
   * @param file New uploaded file (optional).
   * @param body DTO containing updated document info.
   * @param req Authenticated request containing the user.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/documents',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`,
          );
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update document by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string' },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async updateDocument(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UpdateDocumentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentService.updateDocument(id, body, file, req.user);
  }

  /**
   * Deletes a document by its ID.
   * @param id Document ID.
   * @param res HTTP response object.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({ summary: 'Delete document by ID' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID' })
  async delete(@Param('id') id: number, @Res() res: Response) {
    try {
      const result = await this.documentService.delete(id);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({
        message: 'Failed to delete document',
        error: error.message || error,
      });
    }
  }
}
