import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GetUser, JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NoteResponseDto } from './dto/response-note.dto';
import { SearchDocDto } from 'src/docs/dto/search-doc.dto';
import { SearchNoteDto } from './dto/search-note.dto';

@Controller('notes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new note',
    description: 'Create a new note (can be standalone or attached to a document)' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Note created successfully',
    type: NoteResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Document not found (if docId provided)' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Cannot add notes to private documents you do not own' 
  })
  create(@Body() body: CreateNoteDto,@GetUser()user:any) {
    return this.notesService.create(user.id,body);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get user notes',
    description: 'Get all notes created by the current user with search and filter options' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notes retrieved successfully' 
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search in note content' })
  @ApiQuery({ name: 'docId', required: false, description: 'Filter by document ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Skip results' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field', enum: ['createdAt', 'updatedAt'] })
  @ApiQuery({ name: 'order', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  findAll(@GetUser() user: any,@Query()serach:SearchNoteDto) {
    return this.notesService.findAll(user.id,serach);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(+id, updateNoteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(+id);
  }
}
