import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const graphqlEndpoint = '/graphql';
  let companyId: string | null = null;

  describe(graphqlEndpoint, () => {
    describe('company', () => {
      it('createCompany', () => {
        return request(app.getHttpServer())
          .post(graphqlEndpoint)
          .send({
            query: `mutation {
            createCompany(createCompanyInput: {
              name: "test company",
              parentId: null
            }) {
              id
            }
          }`,
          })
          .expect(200)
          .expect((res) => {
            expect(typeof res.body.data.createCompany.id).toBe('string');
            companyId = res.body.data.createCompany.id;
          });
      });

      it('createCompanyTravel', () => {
        return request(app.getHttpServer())
          .post(graphqlEndpoint)
          .send({
            query: `mutation {
              createCompanyTravel(createCompanyTravelInput: {
                companyId: "${companyId}",
                departure: "IT Test",
                destination: "Hanoi",
                employeeName: "Tester",
                price: 10000
              }) {
                id
              }
            }`,
          })
          .expect(200)
          .expect((res) => {
            expect(typeof res.body.data.createCompanyTravel.id).toBe('string');
          });
      });

      it('company', () => {
        return request(app.getHttpServer())
          .post(graphqlEndpoint)
          .send({
            query: `{
            company(id: "${companyId}") {
              id
              cost
            }
          }`,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.data.company.id).toBe(companyId);
            expect(res.body.data.company.cost).toBe(10000);
          });
      });

      it('companyTree', () => {
        return request(app.getHttpServer())
          .post(graphqlEndpoint)
          .send({
            query: '{ companyTree { id }}',
          })
          .expect(200);
      });

      it('removeCompany', () => {
        return request(app.getHttpServer())
          .post(graphqlEndpoint)
          .send({
            query: `mutation { removeCompany(id: "${companyId}") }`,
          })
          .expect(200);
      });
    });
  });
});
