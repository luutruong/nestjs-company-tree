import { InputType, Field, PartialType, OmitType } from '@nestjs/graphql';
import { CreateTravelInput } from './create-travel.input';

@InputType()
export class UpdateTravelInput extends PartialType(
  OmitType(CreateTravelInput, ['companyId']),
) {
  @Field()
  id: string;
}
