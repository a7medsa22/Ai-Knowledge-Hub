import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { BulkSummarizeDto, ExtractKeyPointsDto, QuestionAnswerDto, QuestionAnswerResponseDto, SemanticSearchDto, SummarizeDto, SummarizeResponseDto, SummaryLength } from './dto/ai.dto';
import { GetUser, JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import * as client from '@prisma/client';
import type { JwtUser } from 'src/common/interfaces/jwt-user.interface';


@ApiTags('AI Research')
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


  @Post('summarize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Summarize text or document',
    description:
      'Generate an AI-powered summary of provided text or document. Supports different summary lengths.',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary generated successfully',
    type: SummarizeResponseDto,
    example: {
      result: 'success',
      summary: 'This article discusses the fundamentals of machine learning...',
      provider: 'ollama',
      model: 'phi3:3.8b',
      processingTime: 2500,
      length: 'medium',
      originalLength: 5000,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (text too short/long, or both text and docId provided)',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async summarize(
    @Body() summarizeDto: SummarizeDto,
    @GetUser() user?: JwtUser,
  ): Promise<SummarizeResponseDto> {
    return this.aiService.summarize(summarizeDto, user?.sub);
  }

  @Post('qa')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ask questions about text or document',
    description:
      'Get AI-powered answers to questions based on provided context or document content.',
  })
  @ApiResponse({
    status: 200,
    description: 'Answer generated successfully',
    type: QuestionAnswerResponseDto,
    example: {
      result: 'success',
      answer: 'Machine learning algorithms can be categorized into three main types...',
      question: 'What are the main types of machine learning algorithms?',
      provider: 'ollama',
      model: 'phi3:3.8b',
      processingTime: 3000,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (question too short, context missing)',
  })
  @ApiResponse({
    status: 404,
    description: 'Document not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async answerQuestion(
    @Body() questionAnswerDto: QuestionAnswerDto,
    @GetUser() user?: JwtUser,
  ): Promise<QuestionAnswerResponseDto> {
    return this.aiService.answerQuestion(questionAnswerDto, user?.sub);
  }

  @Post('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Semantic search across documents',
    description:
      'Search documents using AI-powered semantic similarity (currently using text fallback)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
    example: {
      result: 'success',
      data: [
        {
          id: 'doc123',
          title: 'Introduction to Machine Learning',
          content: '...',
          relevance: 0.85,
        },
      ],
      searchType: 'semantic',
      provider: 'ollama',
      meta: {
        total: 10,
        limit: 5,
        offset: 0,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search query',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Semantic search not implemented',
  })
  async semanticSearch(
    @Body() searchDto: SemanticSearchDto,
    @GetUser() user?: JwtUser,
  ) {
    return this.aiService.semanticSearch(searchDto, user?.sub);
  }


  @Post('extract-key-points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Extract key points from text',
    description: 'Use AI to extract the most important key points from text content.',
  })
  @ApiResponse({
    status: 200,
    description: 'Key points extracted successfully',
    example: {
      keyPoints: [
        'Machine learning is a subset of artificial intelligence',
        'There are three main types: supervised, unsupervised, and reinforcement learning',
        'Neural networks are inspired by biological neurons',
      ],
      count: 3,
      provider: 'ollama',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 500,
    description: 'Key point extraction failed',
  })
  async extractKeyPoints(
    @Body() body: ExtractKeyPointsDto,
  ) {
    const { text, count = 5 } = body;
    const keyPoints = await this.aiService.extractKeyPoints(text, count);

    return {
      keyPoints,
      count: keyPoints.length,
      provider: (await this.aiService.getAiStatus()).currentProvider,
    };
  }

  @Post('bulk-summarize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk summarize multiple documents',
    description: 'Generate summaries for multiple documents at once.',
  })
  @ApiResponse({
    status: 200,
    description: 'Bulk summarization completed',
    example: {
      results: [
        {
          docId: 'doc123',
          summary: 'This document discusses...',
        },
        {
          docId: 'doc456',
          summary: 'This article covers...',
        },
      ],
      total: 2,
      successful: 2,
      failed: 0,
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async bulkSummarize(
    @Body() body: BulkSummarizeDto,
    @GetUser() user: JwtUser,
  ) {
    const { docIds, length = SummaryLength.MEDIUM } = body;
    const results = await this.aiService.generateBulkSummaries(
      docIds,
      user.sub,
      length,
    );

    return {
      results,
      total: results.length,
      successful: results.filter((r) => !r.error).length,
      failed: results.filter((r) => r.error).length,
    };
  }

}
