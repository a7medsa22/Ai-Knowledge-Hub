import { PartialType } from '@nestjs/mapped-types';
import { CreateDocDto } from './create-doc.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDocDto {
  @ApiProperty({
    example: 'Introduction to Machine Learning',
    description: 'Title of the document',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiProperty({
    example: 'This article covers the basics of machine learning...',
    description: 'Main content of the document',
  })
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiProperty({
    example: false,
    description: 'Whether the document is publicly visible',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({
    example: ['machine-learning', 'ai', 'tutorial'],
    description: 'Tags for categorizing the document',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  tags?: string[];

  @ApiProperty({
    example: 'This article covers the basics of machine learning...',
    description: 'Main content of the document',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  summary?: string;
}
