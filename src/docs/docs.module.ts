import { forwardRef, Module } from '@nestjs/common';
import { DocsService } from './docs.service';
import { DocsController } from './docs.controller';
import { DocsResolver } from './docs.resolver';
import { FilesModule } from 'src/files/files.module';

@Module({
   imports: [forwardRef(() => FilesModule)],
   controllers: [DocsController],
  providers: [DocsService,DocsResolver],
  exports:[DocsService],


})
export class DocsModule {}
