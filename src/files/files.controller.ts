import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { DocsService } from 'src/docs/docs.service';
import { GetUser } from 'src/auth/guards/jwt-auth.guard';
import { FileResponseDto, LinkedToType, SearchFilesDto } from './dto/files.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import express from 'express';

@ApiTags('Files')
@ApiAuth()
@Controller('files')


export class FilesController {
  constructor(
             private readonly filesService: FilesService
            ,private readonly docsService:DocsService        
  ) {}

   @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Upload a file (image, PDF, document). Max size: 10MB',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        linkedToType: {
          type: 'string',
          enum: ['doc', 'note', 'user'],
          description: 'Optional: Type of entity to link to',
        },
        linkedToId: {
          type: 'string',
          description: 'Optional: ID of entity to link to',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or file too large',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('linkedToType') linkedToType?: LinkedToType,
    @Body('linkedToId') linkedToId?: string,
    @GetUser() user?: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return this.filesService.uploadFile(
      file,
      user.id,
      linkedToType,
      linkedToId,
    );
  }
   
  
    @Post('upload-and-extract')
    @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload file and create document',
    description: 'Upload a file (PDF, Word, text), extract text, and create a new document automatically',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (PDF, Word, or text file)',
        },
        title: {
          type: 'string',
          description: 'Title for the new document',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional tags for the document',
        },
        isPublic: {
          type: 'boolean',
          description: 'Whether the document should be public',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded and document created successfully',
    example: {
      file: {
        id: 'file123',
        filename: 'document.pdf',
        url: 'http://localhost:3000/files/document.pdf',
      },
      document: {
        id: 'doc123',
        title: 'My Research Paper',
        content: 'Extracted text from PDF...',
        wordCount: 1500,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or cannot extract text from this file type',
  })
  async uploadAndExtract(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('tags') tags?: string | string[],
    @Body('isPublic') isPublic?: boolean,
    @GetUser() user?: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!title) {
      throw new BadRequestException('Title is required');
    }

    // Check if we can extract text from this file type
    if (!this.filesService.canExtractText(file.mimetype)) {
      throw new BadRequestException(
        `Cannot extract text from ${file.mimetype}. Supported types: PDF, Word, Plain Text`,
      );
    }

    // Upload file first
    const uploadedFile = await this.filesService.uploadFile(file, user.id);

    // Get file path
    const filePath = this.filesService.getFilePath(file.filename);

    // Extract text from file
    const extractedText = await this.filesService.extractTextFromFile(
      filePath,
      file.mimetype,
    );

    // Parse tags
    let parsedTags: string[] = [];
    if (tags) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(t => t.trim());
      } else {
        parsedTags = tags;
      }
    }

    // Create document with extracted text
    const document = await this.docsService.create(user.id, {
      title,
      content: extractedText,
      tags: parsedTags,
      isPublic: isPublic || true,
    });

    // Link file to document
    await this.filesService.uploadFile(
      file,
      user.id,
      LinkedToType.DOC,
      document.id,
    );

    return {
      file: {
        id: uploadedFile.id,
        filename: uploadedFile.filename,
        originalName: uploadedFile.originalName,
        url: uploadedFile.url,
        size: uploadedFile.size,
      },
      document: {
        id: document.id,
        title: document.title,
        content: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
        wordCount: extractedText.split(/\s+/).length,
        tags: document.tags,
        createdAt: document.createdAt,
      },
      extractedTextLength: extractedText.length,
    };
  }
  
  // Get all files
  @Get()
  @ApiOperation({
    summary: 'Get all files',
    description: 'Get all uploaded files with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    type: [FileResponseDto],
  })
  async findAll(@Query() searchDto: SearchFilesDto) {
    return this.filesService.findAll(searchDto);
  }

  // Get file statistics
  @Get('stats')
  @ApiOperation({
    summary: 'Get file statistics',
    description: 'Get statistics about uploaded files',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats() {
    return this.filesService.getFileStats();
  }

  // Get files for a document
  @Get('document/:docId')
  @ApiOperation({
    summary: 'Get files for a document',
    description: 'Get all files attached to a specific document',
  })
  @ApiResponse({
    status: 200,
    description: 'Document files retrieved successfully',
  })
  async findByDocument(@Param('docId') docId: string) {
    return this.filesService.findByDocument(docId);
  }

  // Get file metadata by ID
  @Get(':id')
  @ApiOperation({
    summary: 'Get file metadata by ID',
    description: 'Get file information and metadata',
  })
  @ApiResponse({
    status: 200,
    description: 'File metadata retrieved successfully',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  // Serve/download file
  @Get('serve/:filename')
  @ApiOperation({
    summary: 'Serve/download file',
    description: 'Download or view a file by filename',
  })
  @ApiResponse({
    status: 200,
    description: 'File served successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  async serveFile(@Param('filename') filename: string, @Res() res:express.Response) {
    const filePath = this.filesService.getFilePath(filename);
    return res.sendFile(filePath);
  }

  // Delete file
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete file',
    description: 'Delete a file (only by owner of linked entity)',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
  })
  @ApiResponse({
    status: 403,
    description: 'You cannot delete this file',
  })
  async remove(@Param('id') id: string, @GetUser() user: any) {
    // Check if user can delete
    const canDelete = await this.filesService.canUserDeleteFile(id, user.id);

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this file');
    }

    return this.filesService.remove(id, user.id);
  }
  
}
