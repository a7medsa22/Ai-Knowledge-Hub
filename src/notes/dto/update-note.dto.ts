import { PartialType } from '@nestjs/mapped-types';
import { CreateNoteDto } from './create-note.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateNoteDto extends PartialType(CreateNoteDto) {
     @ApiProperty({ 
        example: 'Updated note content...',
        description: 'Updated content of the note',
        required: false 
          })
        @IsString()
        @MinLength(1, { message: 'Note content cannot be empty' })
        @IsOptional()
        content:string;
    
    
       @ApiProperty({ 
        example: 'clx1234567890',
        description: 'ID of the document this note belongs to (optional)',
        required: false 
       })
       @IsString()
       @IsOptional()
       docId?:string
}
