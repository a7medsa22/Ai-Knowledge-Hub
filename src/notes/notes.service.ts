import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateNoteDto } from './dto/create-note.dto';

import { Note, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma:PrismaService){}
  
  
  public async create(userId:string,dto: CreateNoteDto):Promise<Note> {
    const {content,docId} = dto;
    if (docId) {
      await this.validateDocumentAccess(docId, userId);
    }

    return this.prisma.note.create({
      data: {
        content,
        authorId: userId,
        docId: docId || null,
      },
      include: this.gerNoteInclude(),
    });
  }
  
   //Standard include for note queries
  private gerNoteInclude(){
    return{
      author:{
        select:{id:true,email:true,name:true}
  },
  doc:{
    select:{id:true,title:true,isPublic:true,authorId:true}
  }
    };
  };

  private async validateDocumentAccess(docId: string, userId: string) {
    const doc = await this.prisma.doc.findUniqueOrThrow({
      where: { id: docId },
      select: {
        id: true,
        authorId: true,
        isPublic: true,
      },
    });

    // User can add notes to their own docs or public docs
    if (!doc.isPublic && doc.authorId !== userId) {
      throw new ForbiddenException('Cannot add notes to private documents you do not own');
    }

    return doc;
  }

 
}
