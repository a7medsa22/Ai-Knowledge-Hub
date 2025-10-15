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
import * as jwtUser from 'src/common/interfaces/jwtUser';
import { JwtUser } from 'src/common/interfaces/jwtUser';
import * as jwtStrategy from 'src/auth/strategies/jwt.strategy';

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
  create(@GetUser() user: jwtStrategy.JwtPayload, @Body() body: CreateDocDto) {
    return this.docsService.create(user.sub, body);
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
  findUserDocs(@GetUser() user: jwtStrategy.JwtPayload, @Query() search: SearchDocDto) {
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
  getStats(@GetUser() user?: jwtStrategy.JwtPayload) {
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
  findOne(@Param('id') id: string, @GetUser() user?: jwtStrategy.JwtPayload) {
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
    @GetUser() user: jwtStrategy.JwtPayload,
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
  remove(@Param('id') id: string, @GetUser() user: jwtStrategy.JwtPayload) {
    return this.docsService.remove(id, user.sub);
  }

  
}