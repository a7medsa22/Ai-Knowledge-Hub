import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { File, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { LinkedToType, SearchFilesDto } from './dto/files.dto';
import { join } from 'path';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import * as mammoth from 'mammoth';
import { BaseSearchService } from '../common/utils/base-search.service';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class FilesService extends BaseSearchService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir = './uploads';
  private readonly baseUrl = process.env.APP_URL || 'http://localhost:3000';

  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

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
    if (!file) {
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

    // Upload to Cloudinary if it's an image or document
    let url = `${this.baseUrl}/files/${file.filename}`;
    let cloudinaryId: string | undefined;

    try {
      const filePath = this.getFilePath(file.filename);
      const uploadResult = await this.uploadToCloudinary(filePath, file.mimetype);
      url = uploadResult.secure_url;
      cloudinaryId = uploadResult.public_id;
      this.logger.log(`File uploaded to Cloudinary: ${url}`);
    } catch (error) {
      this.logger.error(`Cloudinary upload failed: ${error.message}`);
      // Fallback to local URL if Cloudinary fails, or throw error?
      // User specifically wants Cloudinary, so let's keep it required.
      throw new BadRequestException(`Cloudinary upload failed: ${error.message}`);
    }

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

  async uploadToCloudinary(
    filePath: string,
    mimeType: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const options: any = {
        folder: 'ai-research',
        resource_type: 'auto',
      };

      cloudinary.uploader.upload(filePath, options, (error, result) => {
        if (error) return reject(error);
        resolve(result!);
      });
    });
  }

  // Delete file from disk only
  deleteFileFromDisk(filename: string): void {
    const filePath = join(process.cwd(), this.uploadDir, filename);
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        this.logger.log(`Temporary file deleted from disk: ${filename}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete temporary file from disk: ${error.message}`,
      );
    }
  }

  // get all files
  async findAll(searchDto: SearchFilesDto) {
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

    return this.executePaginatedQuery(
      'file',
      where,
      searchDto,
      {
        doc: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      { createdAt: 'desc' },
    );
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
    if (!filename) {
      throw new BadRequestException('File filename is missing. Ensure Multer is configured for disk storage.');
    }
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
  async extractTextFromFile(
    filePath: string,
    mimeType: string,
  ): Promise<string> {
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
          throw new BadRequestException(
            'Cannot extract text from this file type',
          );
      }
    } catch (error) {
      this.logger.error(`Text extraction failed: ${error.message}`);
      throw new BadRequestException(`Failed to extract text: ${error.message}`);
    }
  }

  // Extract text from PDF
  private async extractTextFromPdf(filePath: string): Promise<string> {
    const dataBuffer = readFileSync(filePath);
    const pdfParseModule = await import('pdf-parse');
    const pdfParseFn =
      (
        pdfParseModule as unknown as {
          default?: (input: Buffer) => Promise<{ text: string }>;
        }
      ).default ??
      (pdfParseModule as unknown as (
        input: Buffer,
      ) => Promise<{ text: string }>);
    const data = await pdfParseFn(dataBuffer);
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
