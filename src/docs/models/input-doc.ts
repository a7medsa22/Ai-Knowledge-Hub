import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class InputDocument {
  @Field(() => String)
  title: string;

  @Field(() => String)
  content: string;

  @Field(() => Boolean, { nullable: true })
  isPublic?: boolean;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
