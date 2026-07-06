import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    example: 'College',
    description: 'Name of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiProperty({
    example: 'College course documents and lecture notes',
    description: 'Description of the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '#4F46E5',
    description: 'Hex color representation for styling',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    example: 'book',
    description: 'Icon name representing the category',
    required: false,
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({
    example: false,
    description: 'Whether the category is public',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
