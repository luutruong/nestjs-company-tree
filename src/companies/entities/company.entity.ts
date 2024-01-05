import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Company {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  parentId?: string;

  @Field()
  cost: number;

  @Field()
  createdAt: Date;

  @Field(() => [Company], { nullable: true })
  children?: Company[];
}
