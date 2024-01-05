import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanyInput } from './dto/update-company.input';
import { Company } from './schemas/company.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { forEach } from 'lodash';
import { TravelsService } from './travels.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @Inject(forwardRef(() => TravelsService))
    private readonly travelsService: TravelsService,
    private readonly config: ConfigService,
  ) {}

  async create(createCompanyInput: CreateCompanyInput) {
    let parentId: Types.ObjectId | null = null;
    if (createCompanyInput.parentId) {
      const parentCompany = await this.findOne(createCompanyInput.parentId);
      parentId = parentCompany._id;
    }

    const company = new this.companyModel({
      name: createCompanyInput.name,
      parentId,
    });

    await company.save();

    return await this.findOne(company._id.toString());
  }

  async findChildren(parentId: string) {
    return this.companyModel.where({ parentId: parentId }).exec();
  }

  companyTree() {
    return this.companyModel
      .where({
        parentId: null,
      })
      .exec();
  }

  async findOne(id: string) {
    const company = await this.companyModel.findById(id);
    if (!company) {
      throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
    }

    return company;
  }

  async findOneBySource(sourceId: string) {
    return await this.companyModel
      .findOne({
        sourceId,
      })
      .exec();
  }

  async update(id: string, updateCompanyInput: UpdateCompanyInput) {
    const company = await this.findOne(id);

    const oldParentId = company.parentId;

    if (updateCompanyInput.parentId !== undefined) {
      if (updateCompanyInput.parentId === null) {
        company.parentId = null;
      } else {
        const parent = await this.findOne(updateCompanyInput.parentId);
        company.parentId = parent._id as any;
      }
    }

    forEach(updateCompanyInput, (v, k) => {
      if (k === 'parentId') {
        return;
      }

      company[k] = v;
    });

    await company.save();
    if (company.parentId) {
      await this.rebuildCompanyCost(company.parentId);
    }

    if (oldParentId) {
      await this.rebuildCompanyCost(oldParentId);
    }

    return company;
  }

  async remove(id: string) {
    const company = await this.findOne(id);

    await company.deleteOne().exec();
    await this.travelsService.removeAllCompanyTravels(company._id);
    await this.removeChildren(company._id);

    if (company.parentId) {
      await this.rebuildCompanyCost(company.parentId);
    }

    return 'OK';
  }

  private async removeChildren(parentId: Types.ObjectId) {
    const children = await this.companyModel
      .where({
        parentId,
      })
      .exec();

    for await (const child of children) {
      await child.deleteOne().exec();
      await this.travelsService.removeAllCompanyTravels(child._id);
      await this.removeChildren(child._id);
    }
  }

  async rebuildCompanyCost(companyId: string | mongoose.Schema.Types.ObjectId) {
    const results = await this.companyModel.aggregate([
      {
        $match: {
          parentId: companyId,
        },
      },
      {
        $group: {
          _id: null,
          cost: {
            $sum: '$cost',
          },
        },
      },
    ]);

    const company = await this.companyModel.findById(String(companyId));
    company.cost = results.length > 0 ? results[0].cost : 0;
    await company.save();

    if (company.parentId) {
      // recursive update company cost
      await this.rebuildCompanyCost(company.parentId);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async fetchRemoteData() {
    const mockDataUrl = this.config.get('COMPANY_SEEDING_DATA_API_URL');
    if (!mockDataUrl) {
      this.logger.debug('no mock data seeding url for company');
      return;
    }

    this.logger.debug(`fetch companies remote data: ${mockDataUrl}`);

    const resp = await fetch(mockDataUrl, {
      method: 'GET',
    });

    const data: Array<{
      id: string;
      createdAt: string;
      name: string;
      parentId: string;
    }> = await resp.json();

    for await (const item of data) {
      this.logger.debug('process remote company data', item);

      const company = await this.findOneBySource(item.id);
      const parent = await this.findOneBySource(item.parentId);

      if (company) {
        company.name = item.name;
        company.parentId = (parent?._id ?? null) as any;

        await company.save();
      } else {
        const newCompany = new this.companyModel({
          sourceId: item.id,
          name: item.name,
          createdAt: new Date(item.createdAt),
          parentId: parent?._id ?? null,
        });

        await newCompany.save();
      }
    }
  }
}
