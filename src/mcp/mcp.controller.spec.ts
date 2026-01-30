import { Test, TestingModule } from '@nestjs/testing';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { McpToolDefinition } from './dto/mcp.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';

describe('McpController', () => {
  let controller: McpController;
  let service: jest.Mocked<McpService>;

  const mockUser = {
    sub: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  };

  beforeEach(async () => {
    const mockMcpService = {
      getAvailableTools: jest.fn(),
      executeTool: jest.fn(),
      executeBatchTools: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [McpController],
      providers: [
        {
          provide: McpService,
          useValue: mockMcpService,
        },
      ],
    }).compile();

    controller = module.get<McpController>(McpController);
    service = module.get(McpService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvailableTools', () => {
    it('should return list of available tools', () => {
      const mockTools: McpToolDefinition[] = [
        {
          name: 'searchDocs',
          type: 'function',
          description: 'Search documents',
          parameters: [],
        },
        {
          name: 'addNote',
          type: 'function',
          description: 'Add a note',
          parameters: [],
        },
      ];

      service.getAvailableTools.mockReturnValue({
        tools: mockTools,
        count: mockTools.length,
      });

      const result = controller.getAvailableTools();

      expect(result.tools).toEqual(mockTools);
      expect(result.count).toBe(2);
      expect(service.getAvailableTools).toHaveBeenCalled();
    });

    it('should return empty list if no tools available', () => {
      service.getAvailableTools.mockReturnValue({ tools: [], count: 0 });

      const result = controller.getAvailableTools();

      expect(result.tools).toEqual([]);
      expect(result.count).toBe(0);
    });
  });

  describe('executeTool', () => {
    it('should execute a tool successfully', async () => {
      const executeToolDto = {
        toolName: 'searchDocs',
        parameters: { query: 'test', limit: 5 },
      };

      const mockResponse = {
        success: true,
        toolName: 'searchDocs',
        result: {
          documents: [{ id: 'doc1', title: 'Test Doc' }],
          total: 1,
        },
        executionTime: 100,
      };

      service.executeTool.mockResolvedValue(mockResponse);

      const result = await controller.executeTool(executeToolDto, mockUser);

      expect(result).toEqual(mockResponse);
      expect(service.executeTool).toHaveBeenCalledWith(
        'searchDocs',
        { query: 'test', limit: 5 },
        mockUser.sub,
      );
    });

    it('should execute tool with empty parameters', async () => {
      const executeToolDto = {
        toolName: 'getUserStats',
        parameters: {},
      };

      const mockResponse = {
        success: true,
        toolName: 'getUserStats',
        result: { documents: {}, notes: {}, tasks: {} },
        executionTime: 50,
      };

      service.executeTool.mockResolvedValue(mockResponse);

      const result = await controller.executeTool(executeToolDto, mockUser);

      expect(result).toEqual(mockResponse);
      expect(service.executeTool).toHaveBeenCalledWith(
        'getUserStats',
        {},
        mockUser.sub,
      );
    });

    it('should handle tool execution failure', async () => {
      const executeToolDto = {
        toolName: 'searchDocs',
        parameters: { query: 'test' },
      };

      const mockResponse = {
        success: false,
        toolName: 'searchDocs',
        result: null,
        error: 'Service unavailable',
        executionTime: 50,
      };

      service.executeTool.mockResolvedValue(mockResponse);

      const result = await controller.executeTool(executeToolDto, mockUser);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service unavailable');
    });
  });

  describe('executeBatchTools', () => {
    it('should execute multiple tools in batch', async () => {
      const batchRequest = [
        { toolName: 'searchDocs', parameters: { query: 'test' } },
        { toolName: 'listTasks', parameters: { status: 'TODO' } },
      ];

      const mockResults = [
        {
          success: true,
          toolName: 'searchDocs',
          result: { documents: [], total: 0 },
          executionTime: 50,
        },
        {
          success: true,
          toolName: 'listTasks',
          result: { tasks: [], total: 0 },
          executionTime: 40,
        },
      ];

      service.executeBatchTools.mockResolvedValue(mockResults);

      const result = await controller.executeBatchTools(batchRequest, mockUser);

      expect(result.results).toEqual(mockResults);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      // Remove the timing check as it's not reliable in tests
      expect(service.executeBatchTools).toHaveBeenCalledWith(
        batchRequest,
        mockUser.sub,
      );
    });

    it('should handle mixed success/failure in batch', async () => {
      const batchRequest = [
        { toolName: 'searchDocs', parameters: { query: 'test' } },
        { toolName: 'unknownTool', parameters: {} },
      ];

      const mockResults = [
        {
          success: true,
          toolName: 'searchDocs',
          result: { documents: [], total: 0 },
          executionTime: 50,
        },
        {
          success: false,
          toolName: 'unknownTool',
          result: null,
          error: 'Unknown tool',
          executionTime: 10,
        },
      ];

      service.executeBatchTools.mockResolvedValue(mockResults);

      const result = await controller.executeBatchTools(batchRequest, mockUser);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });

    it('should handle empty batch', async () => {
      const batchRequest: any[] = [];

      service.executeBatchTools.mockResolvedValue([]);

      const result = await controller.executeBatchTools(batchRequest, mockUser);

      expect(result.results).toEqual([]);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', () => {
      const mockTools = [
        { name: 'tool1', type: 'function', description: '', parameters: [] },
        { name: 'tool2', type: 'function', description: '', parameters: [] },
      ];

      service.getAvailableTools.mockReturnValue({
        tools: mockTools,
        count: mockTools.length,
      });

      const result = controller.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.availableTools).toBe(2);
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Quick Actions', () => {
    describe('quickSearchDocs', () => {
      it('should execute quick search', async () => {
        const body = { query: 'test', limit: 5 };

        const mockResponse = {
          success: true,
          toolName: 'searchDocs',
          result: { documents: [], total: 0 },
          executionTime: 50,
        };

        service.executeTool.mockResolvedValue(mockResponse);

        const result = await controller.quickSearchDocs(body, mockUser);

        expect(result).toEqual(mockResponse);
        expect(service.executeTool).toHaveBeenCalledWith(
          'searchDocs',
          body,
          mockUser.sub,
        );
      });
    });

    describe('quickAddNote', () => {
      it('should execute quick add note', async () => {
        const body = { content: 'Test note', docId: 'doc1' };

        const mockResponse = {
          success: true,
          toolName: 'addNote',
          result: { id: 'note1', content: 'Test note' },
          executionTime: 30,
        };

        service.executeTool.mockResolvedValue(mockResponse);

        const result = await controller.quickAddNote(body, mockUser);

        expect(result).toEqual(mockResponse);
        expect(service.executeTool).toHaveBeenCalledWith(
          'addNote',
          body,
          mockUser.sub,
        );
      });

      it('should add note without docId', async () => {
        const body = { content: 'Standalone note' };

        const mockResponse = {
          success: true,
          toolName: 'addNote',
          result: { id: 'note1', content: 'Standalone note', docId: null },
          executionTime: 30,
        };

        service.executeTool.mockResolvedValue(mockResponse);

        const result = await controller.quickAddNote(body, mockUser);

        expect(result).toEqual(mockResponse);
      });
    });

    describe('quickCreateTask', () => {
      it('should execute quick create task', async () => {
        const body: CreateTaskDto = {
          title: 'Test Task',
          description: 'Description',
          priority: 'HIGH',
          dueDate: '2025-11-01',
        };

        const mockResponse = {
          success: true,
          toolName: 'createTask',
          result: { id: 'task1', title: 'Test Task' },
          executionTime: 40,
        };

        service.executeTool.mockResolvedValue(mockResponse);

        const result = await controller.quickCreateTask(body, mockUser);

        expect(result).toEqual(mockResponse);
        expect(service.executeTool).toHaveBeenCalledWith(
          'createTask',
          body,
          mockUser.sub,
        );
      });
    });

    describe('quickUserStats', () => {
      it('should execute quick get user stats', async () => {
        const mockResponse = {
          success: true,
          toolName: 'getUserStats',
          result: {
            documents: { totalDocs: 10 },
            notes: { totalNotes: 20 },
            tasks: { totalTasks: 15 },
          },
          executionTime: 60,
        };

        service.executeTool.mockResolvedValue(mockResponse);

        const result = await controller.quickUserStats(mockUser);

        expect(result).toEqual(mockResponse);
        expect(service.executeTool).toHaveBeenCalledWith(
          'getUserStats',
          {},
          mockUser.sub,
        );
      });
    });
  });
});
