import { Module } from '@nestjs/common';
import { DocsService } from './docs.service';
import { DocsController } from './docs.controller';
import { DocsResolver } from './docs.resolver';

@Module({

   controllers: [DocsController],
  providers: [DocsService],
  exports:[DocsService],


})
export class DocsModule {}
