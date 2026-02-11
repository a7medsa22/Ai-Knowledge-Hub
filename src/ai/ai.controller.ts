import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import {
  BulkSummarizeDto,
  ExtractKeyPointsDto,
  QuestionAnswerDto,
  QuestionAnswerResponseDto,
  SemanticSearchDto,
  SummarizeDto,
  SummarizeResponseDto,
  SummaryLength,
} from './dto/ai.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // Correct import
import { CurrentUser } from 'src/auth/decorators/current-user.decorator'; // Correct import
import { AskQuestionRequestDto, AskQuestionResponseDto, SemanticSearchRequestDto, SemanticSearchResultDto } from './dto/rag.dto';
import * as jwtUserInterface from 'src/common/interfaces/jwt-user.interface';



@ApiTags('AI Research')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Get('status')
  @ApiOperation({ summary: 'Get AI service status' })
  async getStatus() {
    return this.aiService.getAiStatus();
  }

  @Post('summarize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Summarize text or document' })
  @ApiResponse({ status: 200, type: SummarizeResponseDto })
  async summarize(
    @Body() summarizeDto: SummarizeDto,
    @CurrentUser('sub') userId: string,
  ): Promise<SummarizeResponseDto> {
    return this.aiService.summarize(summarizeDto, userId);
  }

  @Post('chat') // Kept for backward compatibility or different use case
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Answer question (Context provided manually)' })
  @ApiResponse({ status: 200, type: QuestionAnswerResponseDto })
  async answerQuestionLegacy(
    @Body() questionAnswerDto: QuestionAnswerDto,
    @CurrentUser('sub') userId: string,
  ): Promise<QuestionAnswerResponseDto> {
    return this.aiService.answerQuestionLegacy(questionAnswerDto, userId);
  }

  @Post('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Semantic search across documents' })
  @ApiResponse({ status: 200, type: [SemanticSearchResultDto] })
  async semanticSearch(
    @Body() searchDto: SemanticSearchRequestDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiService.semanticSearch(searchDto, userId);
  }

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ask question using RAG' })
  @ApiResponse({ status: 200, type: AskQuestionResponseDto })
  async askQuestion(
    @Body() body: AskQuestionRequestDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.aiService.askQuestion(body, userId);
  }

  @Post('extract-key-points')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Extract key points from text' })
  async extractKeyPoints(@Body() body: ExtractKeyPointsDto) {
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
  @ApiOperation({ summary: 'Bulk summarize multiple documents' })
  async bulkSummarize(
    @Body() body: BulkSummarizeDto,
    @CurrentUser() user: jwtUserInterface.JwtUser,
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
