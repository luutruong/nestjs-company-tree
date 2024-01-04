import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Travel {
  @Field((type) => ID)
  id: string;

  @Field()
  employeeName: string;

  @Field()
  departure: string;

  @Field()
  destination: string;

  @Field()
  companyId: string;

  @Field()
  price: number;

  @Field()
  createdAt: Date;
}
