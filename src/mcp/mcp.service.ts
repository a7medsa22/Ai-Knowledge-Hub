import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ExecuteToolDto, McpToolResponse } from './dto/mcp.dto';
import { DocsService } from '../docs/docs.service';
import { NotesService } from '../notes/notes.service';
import { TasksService } from '../tasks/tasks.service';
import { MCP_Tools } from './mcp-tools.registry';
import { SearchDocDto } from '../docs/dto/search-doc.dto';
import { CreateNoteDto } from '../notes/dto/create-note.dto';
import { SearchNoteDto } from '../notes/dto/search-note.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { SearchTasksDto } from '../tasks/dto/search-task.dto';

type ToolParameters = Record<string, unknown>;

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);

  constructor(
    private readonly docsService: DocsService,
    private readonly notesService: NotesService,
    private readonly tasksService: TasksService,
  ) {}

  getAvailableTools() {
    const tools = MCP_Tools;
    return { tools, count: tools.length };
  }

  async executeTool(
    toolName: string,
    parameters: ToolParameters | undefined,
    userId: string,
  ): Promise<McpToolResponse> {
    const startTime = Date.now();
    this.logger.log(`Executing tool: ${toolName} for user: ${userId}`);

    try {
      let result: unknown;
      const toolParams = parameters ?? {};

      switch (toolName) {
        case 'searchDocs':
          result = await this.docsService.findUserDocs(
            toolParams as unknown as SearchDocDto,
            userId,
          );
          break;

        case 'getDocument': {
          const docId =
            this.getStringParameter(toolParams, 'docId') ??
            this.getStringParameter(toolParams, 'id');
          if (docId) {
            result = await this.docsService.findOne(docId, userId);
          } else {
            result = await this.docsService.findAll(
              toolParams as unknown as SearchDocDto,
            );
          }
          break;
        }

        case 'addNote':
          result = await this.notesService.create(
            userId,
            toolParams as unknown as CreateNoteDto,
          );
          break;

        case 'searchNotes':
          result = await this.notesService.findAll(
            userId,
            toolParams as unknown as SearchNoteDto,
          );
          break;

        case 'addTask':
        case 'createTask':
          result = await this.tasksService.create(
            userId,
            toolParams as unknown as CreateTaskDto,
          );
          break;

        case 'searchTasks':
        case 'listTasks':
          result = await this.tasksService.findAll(
            userId,
            toolParams as unknown as SearchTasksDto,
          );
          break;

        case 'getUserStats': {
          const [docs, notes, tasks] = await Promise.all([
            this.docsService.getDocStats(userId),
            this.notesService.getNotesStats(userId),
            this.tasksService.getTasksStats(userId),
          ]);

          result = {
            docs,
            notes,
            tasks,
          };
          break;
        }

        default:
          throw new BadRequestException(`Unknown tool: ${toolName}`);
      }

      const executionTime = Date.now() - startTime;
      this.logger.log(
        `Tool ${toolName} executed successfully in ${executionTime}ms`,
      );

      return { success: true, toolName, result, executionTime };
    } catch (error: unknown) {
      const executionTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      this.logger.error(`Tool ${toolName} failed: ${errorMessage}`);

      return {
        success: false,
        toolName,
        result: null,
        error: errorMessage,
        executionTime,
      };
    }
  }

  async executeBatchTools(
    tools: ExecuteToolDto[],
    userId: string,
  ): Promise<McpToolResponse[]> {
    return Promise.all(
      tools.map(async (tool) =>
        this.executeTool(tool.toolName, tool.parameters, userId),
      ),
    );
  }

  private getStringParameter(
    parameters: ToolParameters,
    key: string,
  ): string | undefined {
    const value = parameters[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
