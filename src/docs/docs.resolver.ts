import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DocsService } from './docs.service';
import { Document } from './models/document';
import { CreateDocDto } from './dto/create-doc.dto';

@Resolver(()=>Document)
export class DocsResolver {
    constructor(private readonly docsService: DocsService){}
    
     @Query(()=>[Document])
      findAll(){
        return this.docsService.findAll()
     }
     @Query(()=>Document)
      findOne(@Args('id') id:string,@Args('userId') userId?:string){
        return this.docsService.findOne(id,userId)
     }
     @Mutation(()=>Document)
     createDoc(@Args('authorId') authorId:string,@Args('dto') dto:CreateDocDto){
        return this.docsService.create(authorId,dto)
     }    
}
