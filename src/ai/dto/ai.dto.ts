import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

enum SummaryLength {
    SHORT = "short",
    MEDIUM = "medium",
    Detailed = "detailed"
}
export class SummarizeDto {
    @ApiProperty({ 
    example: 'Machine learning is a subset of artificial intelligence...',
    description: 'Text content to summarize (if not providing docId)',
    required: false 
  })
  @IsString()
  @IsOptional()
  @MaxLength(10000, { message: 'Text content is too long (max 10,000 characters)' })
    text?: string;


      @ApiProperty({ 
    example: 'clx1234567890',
    description: 'Document ID to summarize (if not providing text)',
    required: false 
  })
    @IsOptional()
    @IsString()
    docId?: string;


     @ApiProperty({ 
    example: SummaryLength.MEDIUM,
    description: 'Length of the summary',
    enum: SummaryLength,
    required: false 
  })
    @IsOptional()
    @IsEnum(SummaryLength)
    length?: SummaryLength = SummaryLength.MEDIUM;
}

export class QuestionAnswerDto {
     @ApiProperty({ 
       example: 'What are the main types of machine learning algorithms?',
       description: 'Question to ask about the content' 
     })
     @IsString()
     @MinLength(5, { message: 'Question must be at least 5 characters long' })
     @MaxLength(500, { message: 'Question is too long (max 500 characters)' })
       question: string;
   
       @ApiProperty({ 
       example: 'clx1234567890',
       description: 'Document ID to use as context (if not providing text)',
       required: false 
     })
     @IsString()
     @IsOptional()
       docId?: string;
   
       @ApiProperty({ 
       example: 'Machine learning is a subset of artificial intelligence...',
       description: 'Context text for answering the question (if not providing docId)',
       required: false 
     })
     @IsString()
     @IsOptional()
     @MaxLength(15000, { message: 'Context text is too long (max 15,000 characters)' })
       context?: string;
}   

export class SemanticSearchDto {
    @ApiProperty({ 
    example: 'neural networks and deep learning',
    description: 'Search query for semantic similarity' 
    })
    @IsString()
    @MinLength(3, { message: 'Search query must be at least 3 characters long' })
    @MaxLength(200, { message: 'Search query is too long (max 200 characters)' })
    query: string;
  
    @ApiProperty({ 
      example: 5,
      description: 'Number of similar documents to return',
      required: false 
    })
    @IsOptional()
    limit?: number = 5;
}

export class AiResponseDto {
    @ApiProperty({ example: 'This is a summarized text...', description: 'Response from AI operation' })
    result: string;

    @ApiProperty({ example: 'openai', description: 'AI provider used for the operation', required: false })
    @IsOptional()
    @IsString()
    provider?: string;
 
    @ApiProperty({ example: 'gpt-4', description: 'Model used for the operation', required: false })
    @IsOptional()
    @IsString()
    model?: string;
    
    @ApiProperty({description: 'Processing time in milliseconds' })
    @IsNumber()
    processingTime: number;

    @ApiProperty({ example: 150, description: 'Number of input tokens used', required: false })
    @IsOptional()
    @IsString()
    inputTokens?: number;

    @ApiProperty({ example: 300, description: 'Number of output tokens generated', required: false })
    @IsOptional()
    @IsString()
    outputTokens?: number;
}


   
   