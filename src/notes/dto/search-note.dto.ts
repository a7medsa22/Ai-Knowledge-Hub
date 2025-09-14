import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class SearchNoteDto {
  // Optional search query for title and content
  @ApiProperty({ 
    example: 'machine learning',
    description: 'Search query for title and content',
    required: false 
  })
  @IsString()
  @IsOptional()
  query?: string;

 // Optional filter by document ID
  @ApiProperty({ 
    example: 'clx1234567890',
    description: 'Filter notes by document ID',
    required: false 
  })
  @IsString()
  @IsOptional()
  docId?: string;

// Optional filter by tags
  @ApiProperty({ 
    example: 10,
    description: 'Number of results to return',
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  // Optional number of results to skip for pagination
   @ApiProperty({ 
    example: 0,
    description: 'Number of results to skip',
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?:number;

    // Optional sorting field and order
  @ApiProperty({ example: 'createdAt', description: 'Sort by field', required: false ,enum:['createdAt','updatedAt']})
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' ;

    // Optional sorting order
  @ApiProperty({ example: 'desc', description: 'Sort order', required: false,enum:['asc','desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}