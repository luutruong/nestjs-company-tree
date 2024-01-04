import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type TravelDocument = HydratedDocument<Travel>;

@Schema()
export class Travel {
  @Prop({ unique: true, default: () => uuidv4() })
  sourceId: string;

  @Prop({ required: true })
  employeeName: string;

  @Prop()
  departure: string;

  @Prop()
  destination: string;

  @Prop({ index: true })
  companyId: MongooseSchema.Types.ObjectId;

  @Prop({ default: 0 })
  price: MongooseSchema.Types.Number;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const TravelSchema = SchemaFactory.createForClass(Travel);
