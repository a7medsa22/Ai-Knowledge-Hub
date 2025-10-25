import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { McpService } from './mcp.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { ExecuteToolDto, McpToolResponse } from './dto/mcp.dto';
import { GetUser } from 'src/auth/guards/jwt-auth.guard';
import type {JwtUser} from 'src/common/interfaces/jwt-user.interface';

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

  


}
