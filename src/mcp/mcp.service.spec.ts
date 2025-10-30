import { Test, TestingModule } from '@nestjs/testing';
import { McpService } from './mcp.service';
import { DocsService } from '../docs/docs.service';
import { NotesService } from '../notes/notes.service';
import { TasksService } from '../tasks/tasks.service';

describe('McpService', () => {
  let service: McpService;
  let docsService: any;
  let notesService: any;
  let tasksService: any;

  const mockUserId = 'user123';

  beforeEach(async () => {
    // Create mock services
    const mockDocsService = {
      findUserDocs: jest.fn().mockResolvedValue({ documents: [{ id: '1', title: 'Test Doc' }] }),
      findOne: jest.fn(),
      getDocStats: jest.fn(),
    };

    const mockNotesService = {
      create: jest.fn(),
      getNotesStats: jest.fn(),
    };

    const mockTasksService = {
      create: jest.fn(),
      findAll: jest.fn(),
      getTasksStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpService,
        {
          provide: DocsService,
          useValue: mockDocsService,
        },
        {
          provide: NotesService,
          useValue: mockNotesService,
        },
        {
          provide: TasksService,
          useValue: mockTasksService,
        },
      ],
    }).compile();

    service = module.get<McpService>(McpService);
    docsService = module.get(DocsService);
    notesService = module.get(NotesService);
    tasksService = module.get(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableTools', () => {
    it('should return list of available tools', () => {
      const tools = service.getAvailableTools();

      expect(tools).toBeDefined();
      expect(Array.isArray(tools.tools)).toBe(true);
      expect(tools.tools.length).toBeGreaterThan(0);
    });

    it('should include all expected tools', () => {
      const tools = service.getAvailableTools();
      const toolNames = tools.tools.map(t => t.name);

      expect(toolNames).toContain('searchDocs');
      expect(toolNames).toContain('getDocument');
      expect(toolNames).toContain('addNote');
      expect(toolNames).toContain('createTask');
      expect(toolNames).toContain('listTasks');
      expect(toolNames).toContain('getUserStats');
    });
  });

  describe('executeTool - searchDocs', () => {
    it('should execute searchDocs tool successfully', async () => {
      const mockDocs = {
        documents: [
          {
            id: '1',
            title: 'Test Document',
            content: 'This is a test document',
          },
        ],
        meta: { total: 1, limit: 5, offset: 0 },
      };

      docsService.findUserDocs.mockResolvedValue(mockDocs);

      const result = await service.executeTool(
        'searchDocs',
        { query: 'test', limit: 5 },
        mockUserId,
      );

      expect(result.success).toBe(true);
      expect(result.toolName).toBe('searchDocs');
      expect(result.result).toEqual(mockDocs);
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });

  describe('executeTool - addNote', () => {
    it('should execute addNote tool successfully', async () => {
      const mockNote = {
        id: 'note1',
        content: 'Test note content',
        docId: 'doc1',
        authorId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      notesService.create.mockResolvedValue(mockNote);

      const result = await service.executeTool(
        'addNote',
        { content: 'Test note content', docId: 'doc1' },
        mockUserId,
      );

      expect(result.success).toBe(true);
      expect(result.result.id).toBe('note1');
    });
  });

  describe('executeTool - createTask', () => {
    it('should execute createTask tool successfully', async () => {
      const mockTask = {
        id: 'task1',
        title: 'Test Task',
        description: 'Task description',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2025-11-01'),
        ownerId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      tasksService.create.mockResolvedValue(mockTask);

      const result = await service.executeTool(
        'createTask',
        {
          title: 'Test Task',
          description: 'Task description',
          priority: 'HIGH',
        },
        mockUserId,
      );

      expect(result.success).toBe(true);
      expect(result.result.title).toBe('Test Task');
    });
  });

  describe('executeTool - Unknown tool', () => {
    it('should return error for unknown tool', async () => {
      const result = await service.executeTool(
        'unknownTool',
        {},
        mockUserId,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('executeBatchTools', () => {
    it('should execute multiple tools in batch', async () => {
      const mockDocs = {
        data: [],
        meta: { total: 0, limit: 5, offset: 0 },
      };

      docsService.findUserDocs.mockResolvedValue(mockDocs);
      tasksService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 0 },
      });

      const tools = [
        { toolName: 'searchDocs', parameters: { query: 'test' } },
        { toolName: 'listTasks', parameters: { status: 'TODO' } },
      ];

      const results = await service.executeBatchTools(tools, mockUserId);

      expect(results).toHaveLength(2);
      expect(results[0].toolName).toBe('searchDocs');
      expect(results[1].toolName).toBe('listTasks');
    });
  });
});