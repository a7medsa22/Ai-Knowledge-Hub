import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { McpService } from './mcp.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '../common/decorators/api-auth.decorator';
import { ExecuteToolDto, McpToolResponse } from './dto/mcp.dto';
import { GetUser } from '../auth/guards/jwt-auth.guard';
import type {JwtUser} from '../common/interfaces/jwt-user.interface';
import { SearchDocDto } from '../docs/dto/search-doc.dto';
import { CreateTaskDto } from '../tasks/dto/create-task.dto';
import { CreateNoteDto } from '../notes/dto/create-note.dto';

@ApiTags('MCP (Model Context Protocol)')
@ApiAuth()
@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

   @Get('tools')
  @ApiOperation({
    summary: 'Get available MCP tools',
    description: 'List all available tools that can be executed via MCP',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available tools retrieved successfully',
    example: {
      tools: [
        {
          name: 'searchDocs',
          description: 'Search for documents by query and tags',
          parameters: [
            {
              name: 'query',
              type: 'string',
              description: 'Search query',
              required: true,
            },
          ],
        },
      ],
      count: 6,
    },
  })
  getAvailableTools() {
    return this.mcpService.getAvailableTools();
  }

  // Execute an MCP tool
   @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute an MCP tool',
    description: 'Execute a specific tool with provided parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Tool executed successfully',
    type: McpToolResponse,
    example: {
      success: true,
      toolName: 'searchDocs',
      result: {
        documents: [
          {
            id: 'doc123',
            title: 'Machine Learning Basics',
            excerpt: 'Introduction to ML...',
          },
        ],
        total: 1,
      },
      executionTime: 150,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid tool name or parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  executeTool(@Body() body: ExecuteToolDto , @GetUser() user: JwtUser) {
    return this.mcpService.executeTool(body.toolName, body.parameters , user.sub);
  }


  @Post('execute-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute multiple MCP tools',
    description: 'Execute multiple tools in a single request',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch execution completed',
    example: {
      results: [
        {
          success: true,
          toolName: 'searchDocs',
          result: { documents: [], total: 0 },
          executionTime: 100,
        },
        {
          success: true,
          toolName: 'listTasks',
          result: { tasks: [], total: 0 },
          executionTime: 80,
        },
      ],
      totalExecutionTime: 180,
      successCount: 2,
      failureCount: 0,
    },
  })
  async executeBatchTools(@Body() body: ExecuteToolDto[] , @GetUser() user: JwtUser) {
    const startTime = Date.now();
    const results = await this.mcpService.executeBatchTools(body , user.sub);
    const executionTime = Date.now() - startTime;
    const successCount = results.filter((result) => result.success).length;
    const failureCount = results.filter((result) => !result.success).length;
    return {
      results,
      totalExecutionTime: executionTime,
      successCount,
      failureCount,
    };
  }

  
  @Get('health')
  @ApiOperation({
    summary: 'Check MCP service health',
    description: 'Verify that MCP service is operational',
  })
  @ApiResponse({
    status: 200,
    description: 'MCP service is healthy',
    example: {
      status: 'healthy',
      availableTools: 6,
      timestamp: '2025-10-17T12:00:00Z',
    },
  })
  healthCheck() {
    const tools = this.mcpService.getAvailableTools();
    return {
      status: 'healthy',
      availableTools: tools.count,
      timestamp: new Date().toISOString(),
    };
  }

  // Quick search docs
  @Post('quick/search-docs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quick search for documents',
    description: 'Search for documents by query',
  })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    
    example: {
      documents: [
        {
          id: 'doc123',
          title: 'Machine Learning Basics',
          excerpt: 'Introduction to ML...',
        },
      ],
      total: 1,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  quickSearchDocs(@Body() body: SearchDocDto , @GetUser() user: JwtUser) {
    return this.mcpService.executeTool('searchDocs', body , user.sub);
  }

  @Get('quick/get-doc')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quick get document',
    description: 'Get document by id',
  })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    example: {
      id: 'doc123',
      title: 'Machine Learning Basics',
      content: 'Introduction to ML...',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid document id',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  quickGetDoc(@Body() body: { docId: string } , @GetUser() user: JwtUser) {
    return this.mcpService.executeTool('getDocument', body , user.sub);
  }

  @Post('quick/add-note')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quick add note',
    description: 'Add note to document',
  })
  @ApiResponse({
    status: 200,
    description: 'Note added successfully',
    example: {
      id: 'note123',
      content: 'This is a note',
      docId: 'doc123',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid document id',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  quickAddNote(@Body() body: CreateNoteDto , @GetUser() user: JwtUser) {
    return this.mcpService.executeTool('addNote', body , user.sub);
  }

  @Post('quick/create-task')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Quick create task',
    description: 'Create a new task',
  })
  @ApiResponse({
    status: 200,
    description: 'Task created successfully',
    example: {
      id: 'task123',
      title: 'Task title',
      description: 'Task description',
      priority: 'LOW',
      dueDate: '2025-10-17T12:00:00Z',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid task data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  quickCreateTask(@Body() body: CreateTaskDto , @GetUser() user: JwtUser) {
    return this.mcpService.executeTool('createTask', body , user.sub);
  }

@Get('quick/user-stats')
@HttpCode(HttpStatus.OK)
@ApiOperation({
  summary: 'Quick get user stats',
  description: 'Get user stats',
})
@ApiResponse({
  status: 200,
  description: 'User stats retrieved successfully',
  example: {
    documents: 10,
    notes: 5,
    tasks: 3,
  },
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized',
})
quickUserStats(@GetUser() user: JwtUser) {
  return this.mcpService.executeTool('getUserStats', {} , user.sub);
}


  
  




}
