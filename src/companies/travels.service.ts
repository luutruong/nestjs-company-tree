import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { forEach } from 'lodash';
import { Travel, TravelDocument } from './schemas/travel.schema';
import { CreateTravelInput } from './dto/create-travel.input';
import { CompaniesService } from './companies.service';
import { UpdateTravelInput } from './dto/update-travel.input';

@Injectable()
export class TravelsService {
  constructor(
    @InjectModel(Travel.name) private travelModel: Model<Travel>,
    @Inject(forwardRef(() => CompaniesService))
    private readonly companiesService: CompaniesService,
  ) {}

  async create(input: CreateTravelInput) {
    const company = await this.companiesService.findOne(input.companyId);

    const travel = new this.travelModel({
      ...input,
      companyId: company._id,
    });

    await this.saveTravel(travel);

    return travel;
  }

  findAll() {
    return this.travelModel.find().exec();
  }

  async findOne(id: string) {
    const travel = await this.travelModel.findById(id);
    if (!travel) {
      throw new HttpException('Company travel not found', HttpStatus.NOT_FOUND);
    }

    return travel;
  }

  async update(id: string, input: UpdateTravelInput) {
    const travel = await this.findOne(id);

    forEach(input, (v, k) => {
      travel[k] = v;
    });

    await this.saveTravel(travel);

    return travel;
  }

  private async saveTravel(travel: TravelDocument) {
    await travel.save();
    const results = await this.travelModel.aggregate([
      {
        $match: {
          companyId: travel.companyId,
        },
      },
      {
        $group: {
          _id: null,
          cost: {
            $sum: '$price',
          },
        },
      },
    ]);

    const company = await this.companiesService.findOne(
      String(travel.companyId),
    );
    company.cost = results.length > 0 ? results[0].cost : 0;
    await company.save();
    if (company.parentId) {
      await this.companiesService.rebuildCompanyCost(company.parentId);
    }

    return travel;
  }

  async remove(id: string) {
    const travel = await this.findOne(id);

    await travel.deleteOne().exec();
    await this.companiesService.rebuildCompanyCost(travel.companyId);

    return 'OK';
  }
}
