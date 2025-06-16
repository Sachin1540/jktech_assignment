import { IsOptional, IsString } from 'class-validator';
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
