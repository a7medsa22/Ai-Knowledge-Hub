import { BadRequestException, Injectable } from '@nestjs/common';
import { ExecuteToolDto, McpToolDefinition, McpToolResponse } from './dto/mcp.dto';
import { DocsService } from 'src/docs/docs.service';
import { NotesService } from 'src/notes/notes.service';
import { TasksService } from 'src/tasks/tasks.service';
import { MCP_Tools } from './mcp-tools.registry';
import { Logger } from '@nestjs/common';

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  constructor(
      private readonly docsService:DocsService
     ,private readonly notesService:NotesService
     ,private readonly tasksService:TasksService){}

      // Get all available MCP tools
  getAvailableTools(){
      return MCP_Tools;
  }

  async executeTool(toolName:string,parameters:any,userId:string):Promise<McpToolResponse>{

  const startTime = Date.now();
    
    this.logger.log(`Executing tool: ${toolName} for user: ${userId}`);

    try {
      let result: any;

      switch (toolName) {
        case 'searchDocs':
          result = this.docsService.findUserDocs(parameters, userId);
          break;

        case 'getDocument':
          result = this.docsService.findOne(parameters, userId);
          break;

        case 'addNote':
          result = await this.notesService.create(userId,parameters);
          break;

        case 'createTask':
          result = await this.tasksService.create(userId,parameters);
          break;

        case 'listTasks':
          result = await this.tasksService.findAll(userId,parameters);
          break;

        case 'getUserStats':
          result = await this.notesService.getNotesStats(userId);
          break;

        default:
          throw new BadRequestException(`Unknown tool: ${toolName}`);
      }

      const executionTime = Date.now() - startTime;

      this.logger.log(`Tool ${toolName} executed successfully in ${executionTime}ms`);

      return {
        success: true,
        toolName,
        result,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      this.logger.error(`Tool ${toolName} failed: ${error.message}`);

      return {
        success: false,
        toolName,
        result: null,
        error: error.message,
        executionTime,
      };
    }
  }


  
    

  findOne(id: number) {
    return `This action returns a #${id} mcp`;
  }

  update(id: number) {
    return `This action updates a #${id} mcp`;
  }

  remove(id: number) {
    return `This action removes #${id} mcp`;
  }
}
