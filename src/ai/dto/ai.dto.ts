import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

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
   
   