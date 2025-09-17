import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { GetUser, JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NoteResponseDto } from './dto/response-note.dto';
import { SearchNoteDto } from './dto/search-note.dto';

export interface JwtUser {
  id: string;
  email: string;
  role: string;
}

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
  create(@Body() body: CreateNoteDto,@GetUser()user:JwtUser) {
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
  findAll(@GetUser() user: JwtUser,@Query()serach:SearchNoteDto) {
    return this.notesService.findAll(user.id,serach);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get note by ID',
    description: 'Get a specific note by its ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Note retrieved successfully',
    type: NoteResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Note not found or access denied' 
  })
  findOne(@Param('id') id: string,@GetUser() user:JwtUser) {
    return this.notesService.findOne(id,user.id);
  }

  @Get('status')
  @ApiOperation({ 
    summary: 'Get note status',
    description: 'Get the status of notes for the current user'})
  @ApiResponse({ 
    status: 200, 
    description: 'Status retrieved successfully'})
  getStatus(@GetUser() user:JwtUser){
    return this.notesService.getNotesStats(user.id);
  }

  @Get('recent')
  @ApiOperation({ 
    summary: 'Get recent notes',
    description: 'Get the most recently updated notes for the current user'})
    @ApiResponse({ 
      status: 200, 
      description: 'Recent notes retrieved successfully',
      type: [NoteResponseDto]})
      @ApiQuery({ name: 'limit', required: false, description: 'Number of recent notes to retrieve, default is 5' })
  getRecent(@GetUser() user:JwtUser,@Query('limit') limit?:string){
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.notesService.getRecentNotes(user.id,parsedLimit);
  }
  @Get('document/:docId')
  @ApiOperation({ 
    summary: 'Get notes for a document',
    description: 'Get all notes associated with a specific document'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notes retrieved successfully'
  })
  @ApiResponse({ 
    status: 404,
    description: 'Document not found or access denied'
  })
   @ApiResponse({ 
    status: 403, 
    description: 'Access denied to private document' 
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search in note content' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Skip results' })
   findByDocument(@Param('docId') docId: string,@GetUser() user:JwtUser,@Query() search:SearchNoteDto) {
    return this.notesService.findByDocument(user.id,docId,search);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update a note',
    description: 'Update the content of an existing note'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Note updated successfully',
    type: NoteResponseDto 
  })
  @ApiResponse({
    status: 404,
    description: 'Note not found or access denied'
  })
  @ApiResponse({ 
    status: 403, 
    description: 'You can only update your own notes' 
  })
  update(@Param('id') id: string,@GetUser() user:JwtUser ,@Body() body: UpdateNoteDto) {
    return this.notesService.update(id,user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete note',
    description: 'Delete a note (only by owner)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Note deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Note not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'You can only delete your own notes' 
  })
  remove(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.notesService.remove(id, user.id);
  }
}
