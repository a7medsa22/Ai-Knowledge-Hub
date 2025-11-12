import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { File, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LinkedToType, SearchFilesDto } from './dto/files.dto';
import { join } from 'path';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');

@Injectable()
export class FilesService {

  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir = './uploads';
  private readonly baseUrl = process.env.APP_URL || 'http://localhost:3000';
    
      constructor(private readonly prisma: PrismaService) {}

    private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

    validateFile(file: Express.Multer.File): void {
      if(!file){
     throw new BadRequestException('No file provided');

      }

     if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: images, PDFs, Word, Excel, text files`,
      );
    }   
}

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    linkedToType?: LinkedToType,
    linkedToId?: string,
  ): Promise<File> {
    this.validateFile(file);

    const url = `${this.baseUrl}/files/${file.filename}`;

    const fileData: Prisma.FileCreateInput = {
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url,
      linkedToType: linkedToType || null,
      linkedToId: linkedToId || null,
    };

    // If linking to a doc, add the relation
    if (linkedToType === LinkedToType.DOC && linkedToId) {
      fileData.doc = {
        connect: { id: linkedToId },
      };
    }

    const uploadedFile = await this.prisma.file.create({
      data: fileData,
    });

    this.logger.log(`File uploaded: ${file.originalname} (${file.size} bytes)`);

    return uploadedFile;
  }

  // get all files 
  async findAll(searchDto: SearchFilesDto): Promise<File[]> {
    const { linkedToType, linkedToId, mimeType } = searchDto;
    const where: Prisma.FileWhereInput = {};

    if (linkedToType) {
      where.linkedToType = linkedToType;
    }

    if (linkedToId) {
      where.linkedToId = linkedToId;
    }

    if (mimeType) {
      where.mimeType = mimeType;
    }

    const files = await this.prisma.file.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include:{
        doc:{
            select:{
                id:true,
                title:true,
            }
        }
      }
    });
    return files;
  }

    // get file by id
    async findOne(id: string): Promise<File> {
    const file = await this.prisma.file.findUnique({
      where: { id },
      include: {
        doc: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }


  // Get file path for serving
  getFilePath(filename: string): string {
    const filePath = join(process.cwd(), this.uploadDir, filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    return filePath;
  }
  
   // Delete file
  async remove(id: string, userId: string): Promise<File> {
    const file = await this.findOne(id);

    // Check if file exists on disk
    const filePath = join(process.cwd(), this.uploadDir, file.filename);

    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.logger.log(`File deleted from disk: ${file.filename}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file from disk: ${error.message}`);
    }

    // Delete from database
    const deletedFile = await this.prisma.file.delete({
      where: { id },
    });

    this.logger.log(`File deleted from database: ${file.originalName}`);

    return deletedFile;
  }

  // Get files by document
  async findByDocument(docId: string) {
    return this.prisma.file.findMany({
      where: {
        docId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get file statistics
  async getFileStats() {
    const [totalFiles, totalSize, filesByType] = await Promise.all([
      this.prisma.file.count(),
      this.prisma.file.aggregate({
        _sum: {
          size: true,
        },
      }),
      this.prisma.file.groupBy({
        by: ['mimeType'],
        _count: {
          mimeType: true,
        },
        orderBy: {
          _count: {
            mimeType: 'desc',
          },
        },
      }),
    ]);

    return {
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      totalSizeMB: ((totalSize._sum.size || 0) / (1024 * 1024)).toFixed(2),
      filesByType: filesByType.map((type) => ({
        mimeType: type.mimeType,
        count: type._count.mimeType,
      })),
    };
  }

  // Check if user can delete file (based on linked entity ownership)
  async canUserDeleteFile(fileId: string, userId: string): Promise<boolean> {
    const file = await this.findOne(fileId);

    // If file is linked to a document, check if user owns the document
    if (file.docId) {
      const doc = await this.prisma.doc.findUnique({
        where: { id: file.docId },
        select: { authorId: true },
      });

      return doc?.authorId === userId;
    }

    // For now, allow deletion if no specific ownership check
    return true;
  }

  // Extract text from file
  async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    try {
      switch (mimeType) {
        case 'application/pdf':
          return await this.extractTextFromPdf(filePath);
        
        case 'application/msword':
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          return await this.extractTextFromWord(filePath);
        
        case 'text/plain':
        case 'text/csv':
          return this.extractTextFromTxt(filePath);
        
        default:
          throw new BadRequestException('Cannot extract text from this file type');
      }
    } catch (error) {
      this.logger.error(`Text extraction failed: ${error.message}`);
      throw new BadRequestException(`Failed to extract text: ${error.message}`);
    }
  }

  // Extract text from PDF
  private async extractTextFromPdf(filePath: string): Promise<string> {
    const dataBuffer = readFileSync(filePath);
    const data = await pdfParse(dataBuffer) ;
    return data.text;
  }
  
  // Extract text from Word
  private async extractTextFromWord(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // Extract text from plain text
  private extractTextFromTxt(filePath: string): string {
    return readFileSync(filePath, 'utf-8');
  }

  // Check if file type supports text extraction
  canExtractText(mimeType: string): boolean {
    const extractableTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ];
    return extractableTypes.includes(mimeType);
  }

}
