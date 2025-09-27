import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';


@ApiTags('AI Services')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService:AiService){}

  @Get('status')
  @ApiOperation({
    summary: 'Get AI service status',
    description: 'Check availability and configuration of AI services',
  })
  @ApiResponse({
    status: 200,
    description: 'AI service status retrieved successfully',
    example: {
      available: true,
      providers: ['ollama', 'openai'],
      currentProvider: 'ollama',
      model: 'phi3:3.8b',
    },
  })
  async getStatus() {
    return this.aiService.getAiStatus();
  }
}
