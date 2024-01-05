import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type CompanyDocument = HydratedDocument<Company>;

@Schema()
export class Company {
  @Prop({ unique: true, default: () => uuidv4() })
  sourceId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ index: true, nullable: true })
  parentId?: MongooseSchema.Types.ObjectId | null;

  @Prop({ default: 0 })
  cost: MongooseSchema.Types.Number;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
