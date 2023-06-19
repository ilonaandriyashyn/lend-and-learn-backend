import { Test } from '@nestjs/testing';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';
import { CanActivate, HttpStatus, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { User } from '../users/user.entity';
import { ValidationGuard } from '../guard/validation.guard';
import { Reservation } from '../reservations/reservations.entity';
import DeviceWithBookedTodayParam from './helpers/device-with-booked-today-param.dto';
import { ReservationsStatus } from '../reservations/reservations-status';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Device } from './device.entity';
import { UserNotFound } from '../exceptions/user-not-found';
import { DeleteResult } from 'typeorm';
import { DeviceNotFound } from '../exceptions/device-not-found';
import { DeviceWithActiveReservations } from '../exceptions/device-with-active-reservations';
import { CustomCodes } from '../consts/codes';
import DevicesWithCount from './helpers/devices-with-count';

class ValidationGuardMock implements CanActivate {
  async canActivate(): Promise<boolean> {
    return true;
  }
}

describe('DevicesController', () => {
  let app: INestApplication;
  let guard: CanActivate;
  const devicesService = {
    findAll: async (): Promise<DevicesWithCount> => ({ total: 0, results: [] }),
    addNewDevice: async (): Promise<Device> => new Device(),
    deleteDevice: async (): Promise<DeleteResult> => new DeleteResult(),
    findDeviceWithOwnerAndReservations: async (): Promise<Device> => new Device(),
    updateDevice: async (): Promise<Device> => new Device(),
  };

  beforeAll(async () => {
    guard = new ValidationGuardMock();
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [DevicesController],
      providers: [
        {
          provide: DevicesService,
          useValue: devicesService,
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

  describe('GET devices', () => {
    it('Empty devices', () => {
      return request(app.getHttpServer()).get('/devices').query({ limit: 10, offset: 0 }).expect(HttpStatus.OK).expect({
        total: 0,
        results: [],
      });
    });

    describe('Validations', () => {
      it('Negative limit', () => {
        return request(app.getHttpServer())
          .get('/devices')
          .query({ limit: -10, offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Zero limit', () => {
        return request(app.getHttpServer())
          .get('/devices')
          .query({ limit: 0, offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('String limit', () => {
        return request(app.getHttpServer())
          .get('/devices')
          .query({ limit: 'abc', offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Object limit', () => {
        return request(app.getHttpServer())
          .get('/devices')
          .query({ limit: { a: 10 }, offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Null limit', () => {
        return request(app.getHttpServer())
          .get('/devices')
          .query({ limit: null, offset: 20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Without limit', () => {
        return request(app.getHttpServer()).get('/devices').query({ offset: 20 }).expect(HttpStatus.BAD_REQUEST);
      });

      it('Negative offset', () => {
        return request(app.getHttpServer())
          .get('/devices')
          .query({ limit: 10, offset: -20 })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('String offset', () => {
        return request(app.getHttpServer())
          .get('/devices')
          .query({ limit: 10, offset: 'abc' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Object offset', () => {
        return request(app.getHttpServer())
          .get('/devices')
          .query({ limit: 10, offset: { a: 10 } })
          .expect(HttpStatus.BAD_REQUEST);
      });

      // converts to zero, so ok
      it('Null offset', () => {
        return request(app.getHttpServer()).get('/devices').query({ limit: 10, offset: null }).expect(HttpStatus.OK);
      });

      it('Without offset', () => {
        return request(app.getHttpServer()).get('/devices').query({ limit: 10 }).expect(HttpStatus.BAD_REQUEST);
      });
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
          reservations: [
            {
              id: 200,
              dateStart: new Date('2021-01-01'),
              dateEnd: new Date('2021-01-09'),
              status: ReservationsStatus.Created,
              user: {
                id: 300,
                username: 'damomat',
                firstName: 'Matt',
                lastName: 'Damon',
                email: 'damomat@test.com',
              } as User,
            },
          ] as Reservation[],
          isBookedToday: false,
        },
      ];
      jest.spyOn(devicesService, 'findAll').mockResolvedValueOnce({ total: 1, results: devices });
      return request(app.getHttpServer())
        .get('/devices')
        .query({ limit: 10, offset: 0 })
        .expect(HttpStatus.OK)
        .expect({
          total: 1,
          results: [
            {
              ...devices[0],
              reservations: [
                {
                  ...devices[0].reservations[0],
                  dateEnd: '2021-01-09T00:00:00.000Z',
                  dateStart: '2021-01-01T00:00:00.000Z',
                },
              ],
            },
          ],
        });
    });

    it('Rejected', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer())
        .get('/devices')
        .query({ limit: 10, offset: 20 })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET device', () => {
    it('Returns device', () => {
      const device: Device = {
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
        reservations: [
          {
            id: 200,
            dateStart: new Date('2021-01-01'),
            dateEnd: new Date('2021-01-09'),
            status: ReservationsStatus.Created,
            user: {
              id: 300,
              username: 'damomat',
              firstName: 'Matt',
              lastName: 'Damon',
              email: 'damomat@test.com',
            } as User,
          },
        ] as Reservation[],
      };
      jest.spyOn(devicesService, 'findDeviceWithOwnerAndReservations').mockResolvedValueOnce(device);
      return request(app.getHttpServer())
        .get('/devices/1')
        .expect(HttpStatus.OK)
        .expect({
          ...device,
          reservations: [
            {
              ...device.reservations[0],
              dateEnd: '2021-01-09T00:00:00.000Z',
              dateStart: '2021-01-01T00:00:00.000Z',
            },
          ],
        });
    });

    it('Rejected with DeviceNotFound', () => {
      jest.spyOn(devicesService, 'findDeviceWithOwnerAndReservations').mockRejectedValueOnce(new DeviceNotFound());
      return request(app.getHttpServer()).get('/devices/1').expect(HttpStatus.NOT_FOUND);
    });

    it('Rejected with unauthorized', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).get('/devices/1').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT device', () => {
    describe('Validation', () => {
      it('Empty name', () => {
        return request(app.getHttpServer())
          .put('/devices/1')
          .send({ name: '', description: 'b' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Null name', () => {
        return request(app.getHttpServer())
          .put('/devices/1')
          .send({ name: null, description: 'b' })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Without name', () => {
        return request(app.getHttpServer()).put('/devices/1').send({ description: 'b' }).expect(HttpStatus.BAD_REQUEST);
      });

      it('Null description', () => {
        return request(app.getHttpServer())
          .put('/devices/1')
          .send({ name: 'a', description: null })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Without description', () => {
        return request(app.getHttpServer()).put('/devices/1').send({ name: 'a' }).expect(HttpStatus.BAD_REQUEST);
      });
    });

    it('Returns OK', () => {
      const device: Device = {
        id: 1,
        name: 'a',
        description: 'b',
        owner: {
          id: 100,
          username: 'dicapleo',
          firstName: 'Leo',
          lastName: 'DiCaprio',
          email: 'dicapleo@test.com',
        } as User,
        reservations: [],
      };
      jest.spyOn(devicesService, 'updateDevice').mockResolvedValueOnce(device);
      return request(app.getHttpServer()).put('/devices/1').send({ name: 'a', description: 'b' }).expect(HttpStatus.OK);
    });

    it('Rejected with DeviceNotFound', () => {
      jest.spyOn(devicesService, 'updateDevice').mockRejectedValueOnce(new DeviceNotFound());
      return request(app.getHttpServer())
        .put('/devices/1')
        .send({ name: 'a', description: 'b' })
        .expect(HttpStatus.NOT_FOUND);
    });

    it('Rejected with unauthorized', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer())
        .put('/devices/1')
        .send({ name: 'a', description: 'b' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('POST create device', () => {
    const device: CreateDeviceDto = {
      name: 'Device',
      description: 'Good',
      username: 'dicapleo',
    };

    it('Success', () => {
      return request(app.getHttpServer()).post('/devices').send(device).expect(HttpStatus.CREATED);
    });

    it('Rejected with unauthorized', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).post('/devices').send(device).expect(HttpStatus.UNAUTHORIZED);
    });

    describe('Rejected with bad request', () => {
      it('User not found', () => {
        jest.spyOn(devicesService, 'addNewDevice').mockRejectedValueOnce(new UserNotFound());
        return request(app.getHttpServer()).post('/devices').send(device).expect(HttpStatus.BAD_REQUEST);
      });

      describe('Validations', () => {
        describe('Bad request', () => {
          it('Empty name', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: '',
                description: 'Good',
                username: 'dicapleo',
              })
              .expect(HttpStatus.BAD_REQUEST);
          });

          it('Null name', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: null,
                description: 'Good',
                username: 'dicapleo',
              })
              .expect(HttpStatus.BAD_REQUEST);
          });

          it('Without name', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                description: 'Good',
                username: 'dicapleo',
              })
              .expect(HttpStatus.BAD_REQUEST);
          });

          it('Null description', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: 'Device',
                description: null,
                username: 'dicapleo',
              })
              .expect(HttpStatus.BAD_REQUEST);
          });

          it('Empty username', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: 'Device',
                description: 'good',
                username: '',
              })
              .expect(HttpStatus.BAD_REQUEST);
          });

          it('Null username', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: 'Device',
                description: 'good',
                username: null,
              })
              .expect(HttpStatus.BAD_REQUEST);
          });
        });
        describe('Created', () => {
          it('Number name', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: 3,
                description: 'Good',
                username: 'dicapleo',
              })
              .expect(HttpStatus.CREATED);
          });

          // not the best, but converts to string, so not a problem
          it('Object name', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: { name: 3 },
                description: 'Good',
                username: 'dicapleo',
              })
              .expect(HttpStatus.CREATED);
          });

          it('Number description', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: 'Device',
                description: 3,
                username: 'dicapleo',
              })
              .expect(HttpStatus.CREATED);
          });

          it('Object description', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: 'Device',
                description: { a: 3 },
                username: 'dicapleo',
              })
              .expect(HttpStatus.CREATED);
          });

          it('Number username', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: 'Device',
                description: 'good',
                username: 3,
              })
              .expect(HttpStatus.CREATED);
          });

          it('Object username', () => {
            return request(app.getHttpServer())
              .post('/devices')
              .send({
                name: 'Device',
                description: 'good',
                username: { a: 2 },
              })
              .expect(HttpStatus.CREATED);
          });
        });
      });
    });
  });

  describe('DELETE device', () => {
    it('Success', () => {
      return request(app.getHttpServer()).delete('/devices/1').expect(HttpStatus.OK);
    });

    it('Without id', () => {
      return request(app.getHttpServer()).delete('/devices').expect(HttpStatus.NOT_FOUND);
    });

    it('Rejected with unauthorized', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).delete('/devices/1').expect(HttpStatus.UNAUTHORIZED);
    });

    it('Rejected because of DeviceNotFound', () => {
      jest.spyOn(devicesService, 'deleteDevice').mockRejectedValueOnce(new DeviceNotFound());
      return request(app.getHttpServer()).delete('/devices/1').expect(HttpStatus.BAD_REQUEST);
    });

    it('Rejected because of DeviceWithActiveReservations', () => {
      jest.spyOn(devicesService, 'deleteDevice').mockRejectedValueOnce(new DeviceWithActiveReservations());
      return request(app.getHttpServer())
        .delete('/devices/1')
        .expect(HttpStatus.BAD_REQUEST)
        .expect({ code: CustomCodes.DeviceWithActiveReservations, message: 'Device has some active reservations' });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
