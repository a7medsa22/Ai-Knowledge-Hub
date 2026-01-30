import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    example:
      'This is an important point to remember about machine learning algorithms...',
    description: 'Content of the note',
  })
  @IsString()
  @MinLength(1, { message: 'Note content cannot be empty' })
  content: string;

  @ApiProperty({
    example: 'clx1234567890 (optional)',
    description: 'ID of the document this note belongs to (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  docId?: string;
}
