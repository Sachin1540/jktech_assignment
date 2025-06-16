import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
/**
 * Data Transfer Object for updating document.
 *
 * Used to validate and document the structure for updating existing document.
 */

/**
 * Data Transfer Object for pagination request.
 */

export class PaginationDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page (max 50)',
    enum: [10, 20, 30, 40, 50],
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20, 30, 40, 50])
  limit?: number = 10;
}
