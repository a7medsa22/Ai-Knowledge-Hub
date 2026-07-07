import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Priority, TaskStatus } from '@prisma/client';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaService;

  const mockPrismaService = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const mockTask = {
        id: 'task-id',
        title: 'test task',
        priority: Priority.MEDIUM,
        ownerId: 'user-id',
      };
      mockPrismaService.task.create.mockResolvedValue(mockTask);

      const result = await service.create('user-id', {
        title: 'test task',
      });

      expect(result).toEqual(mockTask);
      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return task if owner match', async () => {
      const mockTask = { id: 'task-id', ownerId: 'user-id' };
      mockPrismaService.task.findFirst.mockResolvedValue(mockTask);

      const result = await service.findOne('user-id', 'task-id');
      expect(result).toEqual(mockTask);
    });

    it('should throw Error if task not found', async () => {
      mockPrismaService.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-id', 'task-id')).rejects.toThrow('Task not found');
    });
  });

  describe('update', () => {
    it('should update task if owned', async () => {
      const mockTask = { id: 'task-id', ownerId: 'user-id' };
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.task.update.mockResolvedValue({ ...mockTask, title: 'Updated' });

      const result = await service.update('user-id', 'task-id', { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should throw ForbiddenException if user does not own task', async () => {
      const mockTask = { id: 'task-id', ownerId: 'other-user-id' };
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

      await expect(
        service.update('user-id', 'task-id', { title: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
