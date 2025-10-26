import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Document {

       @Field(()=>String)
      id:string;
   

      @Field(()=>String)
      title: string;
    
     
      @Field(()=>String)
      content: string;
       
    
       @Field({nullable:true})
      isPublic?:boolean;
    
           
      @Field({nullable:'items'})
      tags?:string[];
    
    
    
    
}