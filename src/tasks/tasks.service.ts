import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Priority, Prisma, PrismaClient, Task, TaskStatus } from '@prisma/client';
import { SearchTasksDto } from './dto/search-task.dto';
import { BaseSearchService } from 'src/common/utils/base-search.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService extends BaseSearchService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma)
  }

   async create(userId: string, createTaskDto: CreateTaskDto): Promise<Task> {
    const { title, description, priority = Priority.MEDIUM, dueDate } = createTaskDto;

    return this.prisma.task.create({
      data: {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId: userId,
      },
      include: this.getTaskInclude(),
    });
  }
  async findAll(userId:string,searchDto?:SearchTasksDto){
    const where = this.buildWhereClause(userId, searchDto);
    const orderBy = this.buildOrderBy(searchDto, 'createdAt');
    return this.executePaginatedQuery('task', where, searchDto, this.getTaskInclude(), orderBy);
  }

  async findOne(userId:string,taskId:string){
    const task = await this.prisma.task.findFirst({
      where:{
        id:taskId,
        ownerId:userId,
      },
      include:this.getTaskInclude(),
    })
    if(!task){
      throw new Error('Task not found')
    }
    return task
  }
  
  async update(userId:string,taskId:string,dto:UpdateTaskDto):Promise<Task>{
    await this.checkTaskOwnership(taskId, userId);
    const { title, description, priority = Priority.MEDIUM, dueDate } = dto;
    return this.prisma.task.update({
      where:{
        id:taskId,
        ownerId:userId,
      },
      data:{
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include:this.getTaskInclude(),
    })
  }
  
  
  // Private Helper Method
  private getTaskInclude() {
    return {
      owner: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    };
  }
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

  
}
