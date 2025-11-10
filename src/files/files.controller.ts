import { BadRequestException, Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FilesService } from './files.service';
import { DocsService } from 'src/docs/docs.service';
import { GetUser } from 'src/auth/guards/jwt-auth.guard';
import { FileResponseDto, LinkedToType } from './dto/files.dto';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from 'src/common/decorators/api-auth.decorator';
import { FileInterceptor } from '@nestjs/platform-express/multer';

@ApiTags('Files')
@ApiAuth()
@Controller('files')


export class FilesController {
  constructor(
             private readonly filesService: FilesService
            ,private readonly docsServers:DocsService        
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

  
  
}
