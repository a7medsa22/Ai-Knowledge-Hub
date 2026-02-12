import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SemanticSearchRequestDto {
    @ApiProperty({ description: 'The search query', example: 'What is Node.js?' })
    @IsString()
    @IsNotEmpty()
    query: string;

    @ApiPropertyOptional({ description: 'Number of results to return', default: 5, example: 5 })
    @IsNumber()
    @IsOptional()
    topK?: number;
}

export class AskQuestionRequestDto {
    @ApiProperty({ description: 'The question to ask', example: 'How do I use this app?' })
    @IsString()
    @IsNotEmpty()
    question: string;
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
