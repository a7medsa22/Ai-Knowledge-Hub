import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Priority, TaskStatus } from '@prisma/client';

describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  const mockTasksService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    deleteTask: jest.fn(),
    getTasksStats: jest.fn(),
    getUpcomingTasks: jest.fn(),
    updateStatus: jest.fn(),
    getOverdueTasks: jest.fn(),
    searchTasks: jest.fn(),
  };

  const mockUser = {
    sub: 'user-id',
    email: 'test@test.com',
    name: 'Test User',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create', async () => {
      const dto = { title: 'test task', priority: Priority.MEDIUM };
      mockTasksService.create.mockResolvedValue({ id: 'task-id', ...dto });

      const result = await controller.create(mockUser, dto as any);

      expect(service.create).toHaveBeenCalledWith(mockUser.sub, dto);
      expect(result).toEqual({ id: 'task-id', ...dto });
    });
  });

  describe('findOne', () => {
    it('should call service.findOne', async () => {
      mockTasksService.findOne.mockResolvedValue({ id: 'task-id' });

      const result = await controller.findOne('task-id', mockUser);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.sub, 'task-id');
      expect(result).toEqual({ id: 'task-id' });
    });
  });

  describe('update', () => {
    it('should call service.update', async () => {
      const dto = { title: 'updated task' };
      mockTasksService.update.mockResolvedValue({ id: 'task-id', title: 'updated task' });

      const result = await controller.update('task-id', mockUser, dto);

      expect(service.update).toHaveBeenCalledWith(mockUser.sub, 'task-id', dto);
      expect(result).toEqual({ id: 'task-id', title: 'updated task' });
    });
  });

  describe('remove', () => {
    it('should call service.deleteTask', async () => {
      mockTasksService.deleteTask.mockResolvedValue({ id: 'task-id' });

      const result = await controller.remove('task-id', mockUser);

      expect(service.deleteTask).toHaveBeenCalledWith(mockUser.sub, 'task-id');
      expect(result).toEqual({ id: 'task-id' });
    });
  });
});
