import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LinkedToType {
  DOC = 'doc',
  NOTE = 'note',
  USER = 'user',
}

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload',
  })
  file: any;

  @ApiProperty({
    example: 'doc',
    enum: LinkedToType,
    required: false,
    description: 'Type of entity to link file to',
  })
  @IsEnum(LinkedToType)
  @IsOptional()
  linkedToType?: LinkedToType;

  @ApiProperty({
    example: 'doc123',
    required: false,
    description: 'ID of entity to link file to',
  })
  @IsString()
  @IsOptional()
  linkedToId?: string;
}

export class FileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  filename: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  url: string;

  @ApiProperty()
  linkedToType?: string;

  @ApiProperty()
  linkedToId?: string;

  @ApiProperty()
  createdAt: Date;
}

export class SearchFilesDto {
  @ApiProperty({
    example: 'doc',
    enum: LinkedToType,
    required: false,
  })
  @IsEnum(LinkedToType)
  @IsOptional()
  linkedToType?: LinkedToType;

  @ApiProperty({
    example: 'doc123',
    required: false,
  })
  @IsString()
  @IsOptional()
  linkedToId?: string;

  @ApiProperty({
    example: 'image/png',
    required: false,
    description: 'Filter by MIME type',
  })
  @IsString()
  @IsOptional()
  mimeType?: string;
}
