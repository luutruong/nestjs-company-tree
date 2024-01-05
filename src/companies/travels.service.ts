import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { forEach } from 'lodash';
import { Travel, TravelDocument } from './schemas/travel.schema';
import { CreateTravelInput } from './dto/create-travel.input';
import { CompaniesService } from './companies.service';
import { UpdateTravelInput } from './dto/update-travel.input';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TravelsService {
  private readonly logger = new Logger(TravelsService.name);

  constructor(
    @InjectModel(Travel.name) private travelModel: Model<Travel>,
    @Inject(forwardRef(() => CompaniesService))
    private readonly companiesService: CompaniesService,
    private readonly config: ConfigService,
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

  removeAllCompanyTravels(companyId: string | Types.ObjectId) {
    return this.travelModel
      .deleteMany({
        companyId,
      })
      .exec();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async fetchRemoteData() {
    const mockDataUrl = this.config.get('COMPANY_TRAVEL_SEEDING_DATA_API_URL');
    if (!mockDataUrl) {
      this.logger.debug('no mock data url for company travels');
      return;
    }
    this.logger.debug(`fetch company travels remote data: ${mockDataUrl}`);
    const resp = await fetch(mockDataUrl, {
      method: 'GET',
    });

    const data = (await resp.json()) as Array<{
      id: string;
      createdAt: string;
      employeeName: string;
      departure: string;
      destination: string;
      price: string;
      companyId: string;
    }>;

    for await (const item of data) {
      const company = await this.companiesService.findOneBySource(
        item.companyId,
      );
      if (!company) {
        this.logger.error(`failed to fetch company ${item.companyId}`);
        continue;
      }

      const travel = await this.travelModel
        .findOne({
          sourceId: item.id,
        })
        .exec();

      if (travel) {
        travel.employeeName = item.employeeName;
        travel.departure = item.departure;
        travel.destination = item.destination;
        travel.price = parseFloat(item.price) as any;
        travel.companyId = company._id as any;

        await this.saveTravel(travel);
      } else {
        const newTravel = new this.travelModel({
          employeeName: item.employeeName,
          departure: item.departure,
          destination: item.destination,
          price: parseFloat(item.price),
          companyId: company._id,
          sourceId: item.id,
        });

        await this.saveTravel(newTravel);
      }
    }
  }
}
