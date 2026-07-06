import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SearchCategoryDto } from './dto/search-category.dto';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { GetUser } from '../auth/guards/jwt-auth.guard';
import type { JwtUser } from '../common/interfaces/jwt-user.interface';

@ApiTags('Categories')
@ApiAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Create a new category for organizing documents',
  })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  create(@GetUser() user: JwtUser, @Body() body: CreateCategoryDto) {
    return this.categoriesService.create(user.sub, body);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Get current user categories',
    description: 'Get all categories created by the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  findUserCategories(
    @GetUser() user: JwtUser,
    @Query() search: SearchCategoryDto,
  ) {
    return this.categoriesService.findUserCategories(user.sub, search);
  }

  @Get()
  @ApiOperation({
    summary: 'Get public categories',
    description: 'Search and list all public categories',
  })
  @ApiResponse({ status: 200, description: 'Public categories retrieved' })
  findAll(@Query() search: SearchCategoryDto) {
    return this.categoriesService.findAll(search);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Retrieve details of a category including its documents',
  })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.categoriesService.findOne(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update category',
    description: 'Update category details (only by owner)',
  })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  update(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, user.sub, body);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete category',
    description: 'Delete category (only by owner)',
  })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string, @GetUser() user: JwtUser) {
    return this.categoriesService.remove(id, user.sub);
  }

  @Post(':id/docs/:docId')
  @ApiOperation({
    summary: 'Add document to category',
    description: 'Link an existing document to a category',
  })
  @ApiResponse({ status: 201, description: 'Document linked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or already linked' })
  addDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @GetUser() user: JwtUser,
  ) {
    return this.categoriesService.addDocument(id, docId, user.sub);
  }

  @Delete(':id/docs/:docId')
  @ApiOperation({
    summary: 'Remove document from category',
    description: 'Unlink a document from a category',
  })
  @ApiResponse({ status: 200, description: 'Document unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Not found' })
  removeDocument(
    @Param('id') id: string,
    @Param('docId') docId: string,
    @GetUser() user: JwtUser,
  ) {
    return this.categoriesService.removeDocument(id, docId, user.sub);
  }

  @Get(':id/docs')
  @ApiOperation({
    summary: 'Get documents in category',
    description: 'List all documents in a category',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findCategoryDocs(
    @Param('id') id: string,
    @GetUser() user: JwtUser,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.categoriesService.findCategoryDocs(
      id,
      user.sub,
      limit ? parseInt(limit as any) : 20,
      offset ? parseInt(offset as any) : 0,
    );
  }
}
