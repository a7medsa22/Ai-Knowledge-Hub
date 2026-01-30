import { ApiProperty } from '@nestjs/swagger';
import { Priority, TaskStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateTaskDto {
  @ApiProperty({
    example: 'Updated task title',
    required: false,
  })
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Updated description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: TaskStatus.IN_PROGRESS,
    enum: TaskStatus,
    required: false,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({
    example: Priority.URGENT,
    enum: Priority,
    required: false,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiProperty({
    example: '2025-11-15T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    example: TaskStatus.IN_PROGRESS,
    enum: TaskStatus,
    required: true,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
