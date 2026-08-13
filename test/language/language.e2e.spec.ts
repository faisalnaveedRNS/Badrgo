import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Language } from '@utils/enum';
import { AppHelper, createTestApp } from '../app.helper';

let app: INestApplication;
let helper: AppHelper;

beforeAll(async () => {
  app = await createTestApp();
  helper = new AppHelper(app);
});

afterAll(async () => {
  await helper.afterAll();
});

describe('GET /language', () => {
  it('lists the supported languages', async () => {
    const response = await request(app.getHttpServer()).get('/language');

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.data).toEqual(expect.arrayContaining([Language.EN_US, Language.UR]));
  });
});

describe('GET /language/welcome', () => {
  it('falls back to english', async () => {
    const response = await request(app.getHttpServer()).get('/language/welcome?name=John');

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.translation).toBe('Welcome to Badrgo, John.');
  });

  it('resolves the language from the query string', async () => {
    const response = await request(app.getHttpServer()).get('/language/welcome?name=John&lang=ur');

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.language).toBe(Language.UR);
    expect(response.body.translation).toContain('John');
    expect(response.body.translation).not.toBe('Welcome to Badrgo, John.');
  });

  it('resolves the language from the Accept-Language header', async () => {
    const response = await request(app.getHttpServer()).get('/language/welcome').set('Accept-Language', Language.UR);

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.language).toBe(Language.UR);
  });
});
