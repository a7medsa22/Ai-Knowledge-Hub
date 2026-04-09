import { forwardRef, Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express/multer';
import { DocsModule } from 'src/docs/docs.module';
import { CloudinaryProvider } from './cloudinary.provider';
import {
  multerDiskStorage,
  multerFileFilter,
  multerLimits,
} from './multer-config';

@Module({
  imports: [
    forwardRef(() => DocsModule),
    MulterModule.register({
      storage: multerDiskStorage,
      fileFilter: multerFileFilter,
      limits: multerLimits,
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService, CloudinaryProvider],
  exports: [FilesService, CloudinaryProvider],
})
export class FilesModule {}
