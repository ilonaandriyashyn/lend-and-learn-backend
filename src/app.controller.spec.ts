import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { CanActivate, ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthGuard } from '@nestjs/passport';

class AuthGuardMock implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    request.user = { user: { username: 'dicapleo' }, accessToken: 'abc' };
    return true;
  }
}

describe('AppController', () => {
  let app: INestApplication;
  let guard: CanActivate;

  beforeAll(async () => {
    guard = new AuthGuardMock();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [],
    })
      .overrideGuard(AuthGuard('fit'))
      .useValue(guard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  describe('root', () => {
    it('GET /', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(HttpStatus.OK)
        .expect({ user: { username: 'dicapleo' }, accessToken: 'abc' });
    });
  });
});
