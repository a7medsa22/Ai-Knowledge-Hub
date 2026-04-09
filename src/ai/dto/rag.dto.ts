import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SemanticSearchRequestDto {
  @ApiProperty({ description: 'The search query', example: 'What is Node.js?' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    default: 5,
    example: 5,
  })
  @IsNumber()
  @IsOptional()
  topK?: number;

  @ApiPropertyOptional({
    description: 'Filter by document ID',
    example: 'clx1234567890',
  })
  @IsString()
  @IsOptional()
  docId?: string;
}

export class AskQuestionRequestDto {
  @ApiProperty({
    description: 'The question to ask',
    example: 'How do I use this app?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({
    description: 'Document ID to use as context (if not providing text)',
    example: 'clx1234567890',
  })
  @IsString()
  @IsOptional()
  docId?: string;
}

export class SemanticSearchResultDto {
  @ApiProperty()
  docId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  similarity: number;
}

export class AskQuestionResponseDto {
  @ApiProperty()
  answer: string;

  @ApiProperty()
  contextUsed: string[];
}
