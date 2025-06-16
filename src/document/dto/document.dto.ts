import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
/**
 * Data Transfer Object for updating document.
 *
 * Used to validate and document the structure for updating existing document.
 */
export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  filename?: string;
}

/**
 * Data Transfer Object for pagination request.
 */

