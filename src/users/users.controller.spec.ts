import { Test } from '@nestjs/testing';
import { CanActivate, HttpStatus, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ValidationGuard } from '../guard/validation.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Device } from '../devices/device.entity';
import { User } from './user.entity';
import { Reservation } from '../reservations/reservations.entity';
import { ReservationsStatus } from '../reservations/reservations-status';
import DevicesWithCount from '../devices/helpers/devices-with-count';
import DeviceWithBookedTodayParam from '../devices/helpers/device-with-booked-today-param.dto';

class ValidationGuardMock implements CanActivate {
  async canActivate(): Promise<boolean> {
    return true;
  }
}

describe('UsersController', () => {
  let app: INestApplication;
  let guard: CanActivate;
  const usersService = {
    findOne: async (): Promise<User> => new User(),
    updateUser: async (): Promise<User> => new User(),
    findUsersDevices: async (): Promise<DevicesWithCount> => ({ total: 0, results: [] }),
    findUsersReservationsCreated: async (): Promise<Reservation[]> => [],
    findUsersReservationsInProgress: async (): Promise<Reservation[]> => [],
  };

  beforeAll(async () => {
    guard = new ValidationGuardMock();
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    })
      .overrideGuard(ValidationGuard)
      .useValue(guard)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  describe('GET user', () => {
    it('Empty user', () => {
      return request(app.getHttpServer()).get('/users/dicapleo').expect(HttpStatus.OK).expect({});
    });

    it('Non empty user', () => {
      const user: User = {
        id: 100,
        firstName: 'Test',
        lastName: 'User',
        username: 'usertest',
        email: 'usertest@test.com',
        reservations: [],
        ownedDevices: [],
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user);
      return request(app.getHttpServer()).get('/users/usertest').expect(HttpStatus.OK).expect(user);
    });

    it('Rejected', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).get('/users/usertest').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT user', () => {
    it('Empty user', () => {
      return request(app.getHttpServer()).put('/users/usertest/update').expect(HttpStatus.OK).expect({});
    });

    it('Non empty user', () => {
      const user: User = {
        id: 100,
        firstName: 'Test',
        lastName: 'User',
        username: 'usertest',
        email: 'usertest@test.com',
        reservations: [],
        ownedDevices: [],
      };
      jest.spyOn(usersService, 'updateUser').mockResolvedValueOnce(user);
      return request(app.getHttpServer()).put('/users/usertest/update').expect(HttpStatus.OK).expect(user);
    });

    it('Rejected', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).put('/users/usertest/update').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET users devices', () => {
    describe('Validations', () => {
      it('Negative limit', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: -10, offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Zero limit', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: 0, offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('String limit', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: 'abc', offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Object limit', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: { a: 10 }, offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Null limit', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: null, offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Without limit', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Negative offset', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: 10, offset: -20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('String offset', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: 10, offset: 'abc' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Object offset', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: 10, offset: { a: 10 } })
          .expect(HttpStatus.BAD_REQUEST);
      });

      // converts to zero, so ok
      it('Null offset', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: 10, offset: null })
          .expect(HttpStatus.OK);
      });

      it('Without offset', () => {
        return request(app.getHttpServer())
          .get('/users/dicapleo/devices')
          .query({ limit: 10 })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    it('Empty devices', () => {
      return request(app.getHttpServer())
        .get('/users/dicapleo/devices')
        .query({ limit: 10, offset: 0 })
        .expect(HttpStatus.OK)
        .expect({ total: 0, results: [] });
    });

    it('Non empty devices', () => {
      const devices: DeviceWithBookedTodayParam[] = [
        {
          id: 1,
          name: 'device',
          description: 'description',
          owner: {
            id: 100,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
          reservations: null,
          isBookedToday: true,
        },
      ];
      jest.spyOn(usersService, 'findUsersDevices').mockResolvedValueOnce({ total: 1, results: devices });
      return request(app.getHttpServer())
        .get('/users/dicapleo/devices')
        .query({ limit: 10, offset: 0 })
        .expect(HttpStatus.OK)
        .expect({ total: 1, results: devices });
    });

    it('Rejected', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer())
        .get('/users/dicapleo/devices')
        .query({ limit: 10, offset: 0 })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET users created reservations', () => {
    it('Empty reservations', () => {
      return request(app.getHttpServer()).get('/users/dicapleo/reservations/created').expect(HttpStatus.OK).expect([]);
    });

    it('Non empty reservations', () => {
      const reservations: Reservation[] = [
        {
          id: 1,
          dateStart: new Date('2020-01-01'),
          dateEnd: new Date('2020-01-03'),
          status: ReservationsStatus.Created,
          device: {
            id: 10,
          } as Device,
          user: null,
        },
      ];
      jest.spyOn(usersService, 'findUsersReservationsCreated').mockResolvedValueOnce(reservations);
      return request(app.getHttpServer())
        .get('/users/dicapleo/reservations/created')
        .expect(HttpStatus.OK)
        .expect([
          {
            ...reservations[0],
            dateStart: '2020-01-01T00:00:00.000Z',
            dateEnd: '2020-01-03T00:00:00.000Z',
          },
        ]);
    });

    it('Rejected', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).get('/users/dicapleo/reservations/created').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET users in progress reservations', () => {
    it('Empty reservations', () => {
      return request(app.getHttpServer())
        .get('/users/dicapleo/reservations/in-progress')
        .expect(HttpStatus.OK)
        .expect([]);
    });

    it('Non empty reservations', () => {
      const reservations: Reservation[] = [
        {
          id: 1,
          dateStart: new Date('2020-01-01'),
          dateEnd: new Date('2020-01-03'),
          status: ReservationsStatus.InProgress,
          device: {
            id: 10,
          } as Device,
          user: null,
        },
      ];
      jest.spyOn(usersService, 'findUsersReservationsInProgress').mockResolvedValueOnce(reservations);
      return request(app.getHttpServer())
        .get('/users/dicapleo/reservations/in-progress')
        .expect(HttpStatus.OK)
        .expect([
          {
            ...reservations[0],
            dateStart: '2020-01-01T00:00:00.000Z',
            dateEnd: '2020-01-03T00:00:00.000Z',
          },
        ]);
    });

    it('Rejected', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer())
        .get('/users/dicapleo/reservations/in-progress')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
