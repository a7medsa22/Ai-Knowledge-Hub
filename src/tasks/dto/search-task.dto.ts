import { ApiProperty } from '@nestjs/swagger';
import { Priority, TaskStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class SearchTasksDto {
  @ApiProperty({
    example: TaskStatus.TODO,
    description: 'Filter by task status',
    enum: TaskStatus,
    required: false,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({
    example: Priority.HIGH,
    description: 'Filter by priority',
    enum: Priority,
    required: false,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiProperty({
    example: 'ai module',
    description: 'Search query for title and description',
    required: false,
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({
    example: true,
    description: 'Filter overdue tasks',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  overdue?: boolean;

  @ApiProperty({
    example: 10,
    description: 'Number of results to return',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiProperty({
    example: 0,
    description: 'Number of results to skip',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  offset?: number;

  @ApiProperty({
    example: 'dueDate',
    description: 'Sort by field',
    required: false,
    enum: ['createdAt', 'updatedAt', 'dueDate', 'priority'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';

  @ApiProperty({
    example: 'asc',
    description: 'Sort order',
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';
}
