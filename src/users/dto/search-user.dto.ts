import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsIn,
} from 'class-validator';

export class SearchUserDto {
  @ApiProperty({
    example: 'john',
    description: 'Search query for name or email',
    required: false,
  })
  @IsString()
  @IsOptional()
  query?: string;

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
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'email';

  @ApiProperty({ example: 'desc', description: 'Sort order', required: false })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
