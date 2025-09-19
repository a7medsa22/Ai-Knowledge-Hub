import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

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

