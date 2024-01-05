import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesResolver } from './companies.resolver';
import { Company, CompanySchema } from './schemas/company.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Travel, TravelSchema } from './schemas/travel.schema';
import { TravelsService } from './travels.service';

@Module({
  providers: [CompaniesResolver, CompaniesService, TravelsService],

  imports: [
    MongooseModule.forFeature([
      {
        name: Company.name,
        schema: CompanySchema,
      },
      {
        name: Travel.name,
        schema: TravelSchema,
      },
    ]),
  ],

  exports: [CompaniesService, TravelsService],
})
export class CompaniesModule {}
