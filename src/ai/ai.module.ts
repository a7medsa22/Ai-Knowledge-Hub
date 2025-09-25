import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { HttpModule } from '@nestjs/axios';
import { DocsModule } from '../docs/docs.module';

@Module({
  imports:[
    HttpModule,
    DocsModule    
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
