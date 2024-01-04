import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanyInput } from './dto/update-company.input';
import { Company } from './schemas/company.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { forEach } from 'lodash';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    @InjectConnection() private readonly connection: mongoose.Connection,
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
    return this.companyModel.find().exec();
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

    return await this.findOne(company._id.toString());
  }

  async remove(id: string) {
    const company = await this.findOne(id);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await company.deleteOne().exec();
      await this.removeChildren(company._id);

      await session.commitTransaction();

      return 'Company has been deleted';
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async removeChildren(parentId: Types.ObjectId) {
    const children = await this.companyModel
      .where({
        parentId,
      })
      .exec();

    for await (const child of children) {
      await child.deleteOne().exec();
      await this.removeChildren(child._id);
    }
  }
}
