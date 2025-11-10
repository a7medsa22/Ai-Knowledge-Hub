import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';

import { DocsService } from './docs.service';
import { JwtAuthGuard, GetUser } from '../auth/guards/jwt-auth.guard';
import { CreateDocDto } from './dto/create-doc.dto';
import { SearchDocDto } from './dto/search-doc.dto';
import { UpdateDocDto } from './dto/update-doc.dto';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express/multer';

@ApiTags('Documents')
@ApiAuth()
@Controller('docs')
export class DocsController { 
  constructor(private readonly docsService: DocsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ 
    summary: 'Create a new document',
    description: 'Create a new document/article' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Introduction to Machine Learning',
          description: 'Title of the document (required)',
        },
        content: {
          type: 'string',
          example: 'Machine learning is...',
          description: 'Text content (optional if file is provided)',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to extract content from (optional if content is provided)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['machine-learning', 'ai'],
          description: 'Tags for categorizing',
        },
        isPublic: {
          type: 'boolean',
          example: true,
          description: 'Whether document is public',
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Document created successfully' 
  })
   @ApiResponse({ 
    status: 400, 
    description: 'Invalid input (must provide either content or file)' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  create(@GetUser() user: JwtUser, @Body() body: CreateDocDto,
  @UploadedFile() file?: Express.Multer.File,
) {
    return this.docsService.create(user.sub, body,file);
  }


  @Get('my-docs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get current user documents',
    description: 'Get all documents created by the current user' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User documents retrieved successfully' 
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Skip results' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field', enum: ['createdAt', 'updatedAt', 'title'] })
  @ApiQuery({ name: 'order', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  findUserDocs(@GetUser() user: JwtUser, @Query() search: SearchDocDto) {
    return this.docsService.findUserDocs(search, user.sub);
  }


  @Get('tags')
  @ApiOperation({ 
    summary: 'Get all available tags',
    description: 'Get a list of all unique tags used in documents' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Tags retrieved successfully' 
  })
  getAllTags() {
    return this.docsService.getAllTags();
  }

  @Get('status')
  @ApiOperation({ 
    summary: 'Get documents statistics',
    description: 'Get statistics about documents and tags' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully' 
  })
  getStats(@GetUser() user?: JwtUser) {
    return this.docsService.getDocStats(user?.sub);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all public documents',
    description: 'Search and filter public documents' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Documents retrieved successfully' 
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Skip results' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort by field', enum: ['createdAt', 'updatedAt', 'title'] })
  @ApiQuery({ name: 'order', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  findAll(@Query() search: SearchDocDto) {
    return this.docsService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get document by ID',
    description: 'Get a specific document by its ID' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Document retrieved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Document not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied to private document' 
  })
  findOne(@Param('id') id: string, @GetUser() user?: JwtUser) {
    return this.docsService.findOne(id, user?.sub);
  }


  @Patch(':id') 
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update document',
    description: 'Update a document (only by owner)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Document updated successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Document not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'You can only update your own documents' 
  })
  update(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() body: UpdateDocDto,
  ) {
    return this.docsService.update(id, user.sub, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Delete document',
    description: 'Delete a document (only by owner)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Document deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Document not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'You can only delete your own documents' 
  })
  remove(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.docsService.remove(id, user.sub);
  }

  
}