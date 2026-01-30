import { ApiProperty } from '@nestjs/swagger';
import { Priority, TaskStatus } from '@prisma/client';

export class TaskResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description?: string;

  @ApiProperty({ enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ enum: Priority })
  priority: Priority;

  @ApiProperty()
  dueDate?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  owner: {
    id: string;
    email: string;
    name?: string;
  };
}
