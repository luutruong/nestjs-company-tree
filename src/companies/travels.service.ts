import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { forEach } from 'lodash';
import { Travel } from './schemas/travel.schema';
import { CreateTravelInput } from './dto/create-travel.input';
import { CompaniesService } from './companies.service';
import { UpdateTravelInput } from './dto/update-travel.input';

@Injectable()
export class TravelsService {
  constructor(
    @InjectModel(Travel.name) private travelModel: Model<Travel>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly companiesService: CompaniesService,
  ) {}

  async create(input: CreateTravelInput) {
    const company = await this.companiesService.findOne(input.companyId);

    const travel = new this.travelModel({
      ...input,
      companyId: company._id,
    });

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await travel.save();
      await this.updateCompanyCost(travel.companyId);
    } catch (err) {
      session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

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

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await travel.save();
      await this.updateCompanyCost(travel.companyId);
    } catch (err) {
      session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return travel;
  }

  async remove(id: string) {
    const travel = await this.findOne(id);

    await travel.deleteOne().exec();

    return 'Company travel has been deleted';
  }

  async updateCompanyCost(companyId: string | mongoose.Schema.Types.ObjectId) {
    const results = await this.travelModel.aggregate([
      {
        $match: {
          companyId: companyId,
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

    const company = await this.companiesService.findOne(String(companyId));
    company.cost = results.length > 0 ? results[0].cost : 0;
    await company.save();

    if (company.parentId) {
      // recursive update company cost
      await this.updateCompanyCost(company.parentId);
    }
  }
}
