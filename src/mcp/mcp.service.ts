import { Injectable } from '@nestjs/common';
import { ExecuteToolDto, McpToolDefinition } from './dto/mcp.dto';
import { DocsService } from 'src/docs/docs.service';
import { NotesService } from 'src/notes/notes.service';
import { TasksService } from 'src/tasks/tasks.service';
import { MCP_Tools } from './mcp-tools.registry';

@Injectable()
export class McpService {
  constructor(
      private readonly docsService:DocsService
     ,private readonly notesService:NotesService
     ,private readonly tasksService:TasksService){}

      // Get all available MCP tools
  getAvailableTools(){
      return MCP_Tools;
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
