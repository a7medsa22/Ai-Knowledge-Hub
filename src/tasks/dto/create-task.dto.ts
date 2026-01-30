import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    example: 'Complete AI module implementation',
    description: 'Title of the task',
  })
  @IsString()
  @MinLength(1, { message: 'Task title cannot be empty' })
  title: string;

  @ApiProperty({
    example: 'Implement AI summarization, Q&A, and semantic search features',
    description: 'Detailed description of the task',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: Priority.HIGH,
    description: 'Priority level of the task',
    enum: Priority,
    required: false,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiProperty({
    example: '2025-10-30T23:59:59Z',
    description: 'Due date for the task (ISO 8601 format)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
