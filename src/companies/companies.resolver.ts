import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CreateCompanyInput } from './dto/create-company.input';
import { UpdateCompanyInput } from './dto/update-company.input';
import { CreateTravelInput } from './dto/create-travel.input';
import { TravelsService } from './travels.service';
import { Travel } from './entities/travel.entity';

@Resolver(() => Company)
export class CompaniesResolver {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly travelsService: TravelsService,
  ) {}

  @Mutation(() => Company)
  createCompany(
    @Args('createCompanyInput') createCompanyInput: CreateCompanyInput,
  ) {
    return this.companiesService.create(createCompanyInput);
  }

  @Query(() => [Company])
  companyTree() {
    return this.companiesService.companyTree();
  }

  @Query(() => Company, { name: 'company' })
  async findOne(@Args('id') id: string) {
    const company = await this.companiesService.findOne(id);

    return company;
  }

  @Mutation(() => Company)
  updateCompany(
    @Args('updateCompanyInput') updateCompanyInput: UpdateCompanyInput,
  ) {
    return this.companiesService.update(
      updateCompanyInput.id,
      updateCompanyInput,
    );
  }

  @Mutation(() => String)
  removeCompany(@Args('id') id: string) {
    return this.companiesService.remove(id);
  }

  @Mutation(() => Travel)
  createCompanyTravel(
    @Args('createCompanyTravelInput')
    createCompanyTravelInput: CreateTravelInput,
  ) {
    return this.travelsService.create(createCompanyTravelInput);
  }

  @ResolveField()
  async children(@Parent() company: Company) {
    return this.companiesService.findChildren(company.id);
  }
}
