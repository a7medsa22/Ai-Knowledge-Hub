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





