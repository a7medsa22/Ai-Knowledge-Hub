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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { DocsService } from './docs.service';
import { JwtAuthGuard, GetUser } from '../auth/guards/jwt-auth.guard';
import { CreateDocDto } from './dto/create-doc.dto';
import { SearchDocDto } from './dto/search-doc.dto';
import { UpdateDocDto } from './dto/update-doc.dto';

@ApiTags('Documents')
@Controller('docs')
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Create a new document',
    description: 'Create a new document/article' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Document created successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  create(@GetUser() user: any, @Body() body: CreateDocDto) {
    return this.docsService.create(user.id, body);
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
  findAll(@Query() search: SearchDocDto) {
    return this.docsService.findAll(search);
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
  findUserDocs(@GetUser() user: any, @Query() search: SearchDocDto) {
    return this.docsService.findUserDocs(search, user.id);
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
  findOne(@Param('id') id: string, @GetUser() user?: any) {
    return this.docsService.findOne(id, user?.id);
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
    @GetUser() user: any,
    @Body() body: UpdateDocDto,
  ) {
    return this.docsService.update(id, user.id, body);
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
  remove(@Param('id') id: string, @GetUser() user: any) {
    return this.docsService.remove(id, user.id);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get document statistics',
    description: 'Get statistics about documents (only by owner)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Document statistics retrieved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Document not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'You can only update your own documents' 
  })
  async getDocStats(@GetUser() user: any) {
    return this.docsService.getDocStats(user.id);
  }
}