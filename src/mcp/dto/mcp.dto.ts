import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class McpToolParameter {
    @ApiProperty({
        example: 'name',
        description: 'Parameter name',
    })
    name: string;
    @ApiProperty({
        example: 'type',
        description: 'Parameter type',
    })
    type: string;

    @ApiProperty({
        example: 'description',
        description: 'Parameter description',
    })
    description: string;
    
    @ApiProperty({
        example: 'required',
        description: 'Parameter required',
        required:false
    })
    required?: boolean;
}
export class McpToolDefinition {
    @ApiProperty({
        example: 'name',
        description: 'Tool name',
    })
    name: string;

    @ApiProperty({
        example: 'type',
        description: 'Tool type',
    })
    type: string;
    @ApiProperty({
        example: 'description',
        description: 'Tool description',
    })
    description: string;

    @ApiProperty({
        example: 'parameters',
        description: 'Tool parameters',
        type: [McpToolParameter],
    })
    parameters: McpToolParameter[];
}

// MCP Tool Execution Request
export class ExecuteToolDto {
  @ApiProperty({ 
    example: 'searchDocs',
    description: 'Name of the tool to execute'
  })
  @IsString()
  toolName: string;

  @ApiProperty({ 
    example: { query: 'machine learning', limit: 5 },
    description: 'Parameters for the tool'
  })
  @IsOptional()
  parameters?: Record<string, any>;
}

// Search Documents Tool
export class SearchDocsToolDto {
  @ApiProperty({ example: 'machine learning' })
  @IsString()
  query: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: ['ai', 'tutorial'], required: false, type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

// Add Note Tool
export class AddNoteToolDto {
  @ApiProperty({ example: 'This is an important observation...' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'doc123', required: false })
  @IsString()
  @IsOptional()
  docId?: string;
}


// Create Task Tool
export class CreateTaskToolDto {
  @ApiProperty({ example: 'Review AI implementation' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Check all AI endpoints', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'HIGH', required: false })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: '2025-11-01T23:59:59Z', required: false })
  @IsString()
  @IsOptional()
  dueDate?: string;
}

// List Tasks Tool
export class ListTasksToolDto {
  @ApiProperty({ example: 'TODO', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'HIGH', required: false })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  limit?: number; 
}
// Get Document Tool
export class GetDocumentToolDto {
  @ApiProperty({ example: 'doc123'  })
  @IsString()
  docId: string;
}

// MCP Response
export class McpToolResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'toolName' })
  toolName: string;

  @ApiProperty({ example: 'result' })
  result: any;

  @ApiProperty({ example: 'error', required: false })
  error?: string;

  @ApiProperty({ example: 100 })
  executionTime: number;
}

// MCP Tool Execution Response
export class McpToolExecutionResponse {
  @ApiProperty({ example: 'toolName' })
  toolName: string;

  @ApiProperty({ example: 'result' })
  result: any;

  @ApiProperty({ example: 'error', required: false })
  error?: string;

  @ApiProperty({ example: 100 })
  executionTime: number;
}

// MCP Tool Execution Request
export class McpToolExecutionRequest {
  @ApiProperty({ example: 'toolName' })
  toolName: string;

  @ApiProperty({ example: 'parameters' })
  parameters: any;
}





