import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanyInput } from './dto/update-company.input';
import { Company } from './schemas/company.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { forEach } from 'lodash';
import { TravelsService } from './travels.service';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @Inject(forwardRef(() => TravelsService))
    private readonly travelsService: TravelsService,
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
}
