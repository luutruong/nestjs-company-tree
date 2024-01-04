import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateTravelInput {
  @Field()
  employeeName: string;

  @Field()
  departure: string;

  @Field()
  destination: string;

  @Field()
  price: number;

  @Field()
  companyId: string;
}
