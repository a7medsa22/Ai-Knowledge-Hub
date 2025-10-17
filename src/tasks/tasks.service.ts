import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Prisma, PrismaClient, TaskStatus } from '@prisma/client';
import { SearchTasksDto } from './dto/search-task.dto';
import { BaseSearchService } from 'src/common/utils/base-search.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService extends BaseSearchService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
  }


  // Private Helper Method
    private buildWhereClause(userId: string, searchDto?: SearchTasksDto): Prisma.TaskWhereInput {
    const { query, status, priority, overdue } = searchDto || {};
    const where: Prisma.TaskWhereInput = { ownerId: userId, AND: [] };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (status) (where.AND as any[]).push({ status });
    if (priority) (where.AND as any[]).push({ priority });
    if (overdue)
      (where.AND as any[]).push({
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE },
      });

    if ((where.AND as any[]).length === 0) delete where.AND;
    return where;
  }

  async searchTasks(userId: string, searchDto?: SearchTasksDto) {
    const where = this.buildWhereClause(userId, searchDto);
    const orderBy = this.buildOrderBy(searchDto, 'createdAt');
    return this.executePaginatedQuery('task', where, searchDto, this.getTaskInclude(), orderBy);
  }

  async checkTaskOwnership(taskId: string, userId: string) {
    return this.checkOwnership('task', taskId, userId, 'ownerId');
  }

  private getTaskInclude() {
    return {
      owner: true,
      comments: true,
    };
  }
}
