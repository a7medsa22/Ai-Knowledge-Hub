import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateDocDto } from './dto/create-doc.dto';
import { UpdateDocDto } from './dto/update-doc.dto';
import { Doc, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchDocDto } from './dto/search-doc.dto';
import { constants } from 'buffer';

@Injectable()
export class DocsService {
  constructor(private readonly prisma:PrismaService){}
  create(authorId:string, dto: CreateDocDto):Promise<Doc> {
   return this.prisma.doc.create({
    data:{
      ...dto,authorId
    },
    include:this.getDocIncloude(),
   });
  }


 async findAll(search?:SearchDocDto) {
   const where = this.buildQuery(search,{isPublic:true});
   return this.executeQuery(where,search);
  };
  
  async findUserDocs (search?:SearchDocDto,userId?:string){
    const where = this.buildQuery(search,{authorId:userId});
    return this.executeQuery(where,search);
  };

 async findOne(id: string,userId:string) {  
    if(userId)
      await this.checkDocumentAccess(id,userId,'read');

    const doc = await this.prisma.doc.findUniqueOrThrow({
      where:{id},
      include:this.getDocIncloude(),
    });

    if (!userId && doc.isPublic) 
      throw new ForbiddenException('Document is public');  
    
    return doc;
  }


async update(id: string,userId:string ,dto: UpdateDocDto) {
    if(userId)
      await this.checkDocumentAccess(id,userId,'write');

    return this.prisma.doc.update({
      where:{id},
      data:dto,
      include:this.getDocIncloude()
    });
  }


 async remove(id: string,userId?:string) {
   if(userId)
      await this.checkDocumentAccess(id,userId,'write');
    
   return this.prisma.doc.delete({
      where:{id},
    });
  }

async getAllTags(): Promise<string[]> {
    const docs = await this.prisma.doc.findMany({
      select: {
        tags: true,
      },
      where: {
        isPublic: true, // Only tags from public docs
      },
    });

    // Extract unique tags
    const allTags = docs.flatMap((doc) => doc.tags);
    return Array.from(new Set(allTags)).sort();
  }

  // Utility methods for statistics
  async getDocStats(userId?: string) {
    const where = userId ? { authorId: userId } : { isPublic: true };
    
    const [totalDocs, totalTags] = await Promise.all([
      this.prisma.doc.count({ where }),
      this.getAllTags(),
    ]);

    return {
      totalDocs,
      totalTags: totalTags.length,
      uniqueTags: totalTags,
    };
  }

    
  private getDocIncloude(){
    return {
      author:{
        select:{
           id: true,
            email: true,
            name: true,
            role: true,
        }
      },
      notes:{
       incloud:{
       author:{
       select:{
           id: true,
            email: true,
            name: true,
        },
       },
       },
        
        orderBy:{createdAt:'desc' as const}
      },
      _count:{select:{notes:true}},
    }
  }
  private buildQuery(search?:SearchDocDto,additionalWhere?:Prisma.DocWhereInput){
    const {query , tags } = search || {} ; 
    const where:Prisma.DocWhereInput = {...(additionalWhere || {})};
    const and:Prisma.DocWhereInput[] = [];
    
    if(search?.query){
      and.push({
         OR:[
            {title:{contains:query, mode:'insensitive'}},
            {content:{contains:query,mode:'insensitive'}}
          ]
      });
    }

    if(tags?.length){
      and.push({tags:{hasSome:tags} })
    };

    if(and.length){
      where.AND= and;
    }
    return where;
  }

  private buildOrderBy(search?:SearchDocDto){
    const { sortBy = 'updatedAt', order = 'desc' } = search || {};
    
    return {
      [sortBy]: order,
    };
}

private async executeQuery(where:Prisma.DocWhereInput,search?:SearchDocDto){
  
  const MAX_LIMIT = 100;
  const offset = search?.offset ?? 0;
  const limit = Math.min((search?.limit ?? 10), (MAX_LIMIT));
  const [docs,total]= await this.prisma.$transaction([
    this.prisma.doc.findMany({
      where,
      include: this.getDocIncloude(),
      orderBy:this.buildOrderBy(search),
      take:limit,
      skip:offset
    }),
    this.prisma.doc.count({where})
  ]);
  return{
    data:docs,
    total,
    limit,
    offset,
    hasMore: offset + limit <total,
  };

  
}

private async checkDocumentAccess(id:string,userId:string,action:'read'|'write'){

  const doc = await this.prisma.doc.findUniqueOrThrow
  ({
    where:{id},
    select:{
      id:true,
      authorId:true,
      isPublic:true,
    }
  });

  if(action === 'write' && doc.authorId !== userId)
        throw new ForbiddenException(`You can only ${action === 'write' ? 'modify' : 'access'} your own documents`);

  
  if (action === 'read' && !doc.isPublic && doc.authorId !== userId) 
        throw new ForbiddenException('Access denied to this private document');
  
  return doc;

}



}
