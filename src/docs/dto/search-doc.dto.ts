import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SearchDocDto {
  @ApiProperty({
    example: 'machine learning',
    description: 'Search query for title and content',
    required: false,
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({
    example: ['ai', 'tutorial'],
    description: 'Filter by tags',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  tags?: string[];

  @ApiProperty({
    example: 10,
    description: 'Number of results to return',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiProperty({
    example: 0,
    description: 'Number of results to skip',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number;

  @ApiProperty({
    example: 'createdAt',
    description: 'Sort by field',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'title';

  @ApiProperty({ example: 'desc', description: 'Sort order', required: false })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
