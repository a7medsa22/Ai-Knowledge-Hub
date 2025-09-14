import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';

@Module({
  controllers: [NotesController],
  providers: [NotesService],
  exports:[NotesService],
})
export class NotesModule {}
