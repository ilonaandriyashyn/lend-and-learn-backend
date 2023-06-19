import { Test } from '@nestjs/testing';
import { CanActivate, HttpStatus, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ValidationGuard } from '../guard/validation.guard';
import { UserNotFound } from '../exceptions/user-not-found';
import { DeviceNotFound } from '../exceptions/device-not-found';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation-dto';
import { Reservation } from './reservations.entity';
import { ReservationCollision } from '../exceptions/reservation-collision';
import { ReservationNotFound } from '../exceptions/reservation-not-found';
import { ReservationWrongStatus } from '../exceptions/reservation-wrong-status';
import { ReservationsStatus } from './reservations-status';
import { Device } from '../devices/device.entity';

class ValidationGuardMock implements CanActivate {
  async canActivate(): Promise<boolean> {
    return true;
  }
}

describe('ReservationsController', () => {
  let app: INestApplication;
  let guard: CanActivate;
  const reservationsService = {
    addNewReservation: async (): Promise<Reservation> => new Reservation(),
    finishReservation: async (): Promise<Reservation> => new Reservation(),
    approveReservation: async (): Promise<Reservation> => new Reservation(),
    cancelReservation: async (): Promise<Reservation> => new Reservation(),
    findUsersIncomeCreatedReservations: async (): Promise<Reservation[]> => [],
    findUsersIncomeInProgressReservations: async (): Promise<Reservation[]> => [],
  };

  beforeAll(async () => {
    guard = new ValidationGuardMock();
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [ReservationsController],
      providers: [
        {
          provide: ReservationsService,
          useValue: reservationsService,
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

  describe('POST create reservation', () => {
    const reservation: CreateReservationDto = {
      deviceId: 1,
      dateStart: new Date('2020-01-01'),
      dateEnd: new Date('2020-01-03'),
    };

    it('Success', () => {
      return request(app.getHttpServer()).post('/reservations').send(reservation).expect(HttpStatus.CREATED);
    });

    it('Rejected with unauthorized', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).post('/reservations').send(reservation).expect(HttpStatus.UNAUTHORIZED);
    });

    describe('Rejected with bad request', () => {
      it('Reservation collision', () => {
        jest.spyOn(reservationsService, 'addNewReservation').mockRejectedValueOnce(new ReservationCollision());
        return request(app.getHttpServer()).post('/reservations').send(reservation).expect(HttpStatus.BAD_REQUEST);
      });

      it('User not found', () => {
        jest.spyOn(reservationsService, 'addNewReservation').mockRejectedValueOnce(new UserNotFound());
        return request(app.getHttpServer()).post('/reservations').send(reservation).expect(HttpStatus.BAD_REQUEST);
      });

      it('Device not found', () => {
        jest.spyOn(reservationsService, 'addNewReservation').mockRejectedValueOnce(new DeviceNotFound());
        return request(app.getHttpServer()).post('/reservations').send(reservation).expect(HttpStatus.BAD_REQUEST);
      });

      it('Empty date start', () => {
        return request(app.getHttpServer())
          .post('/reservations')
          .send({
            deviceId: 1,
            dateStart: '',
            dateEnd: new Date('2020-01-03'),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Empty date end', () => {
        return request(app.getHttpServer())
          .post('/reservations')
          .send({
            deviceId: 1,
            dateStart: new Date('2020-01-03'),
            dateEnd: '',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Null date start', () => {
        return request(app.getHttpServer())
          .post('/reservations')
          .send({
            deviceId: 1,
            dateStart: null,
            dateEnd: new Date('2020-01-03'),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Null date end', () => {
        return request(app.getHttpServer())
          .post('/reservations')
          .send({
            deviceId: 1,
            dateStart: new Date('2020-01-03'),
            dateEnd: null,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Without date start', () => {
        return request(app.getHttpServer())
          .post('/reservations')
          .send({
            deviceId: 1,
            dateEnd: new Date('2020-01-03'),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Without date end', () => {
        return request(app.getHttpServer())
          .post('/reservations')
          .send({
            deviceId: 1,
            dateStart: new Date('2020-01-03'),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('String device id', () => {
        return request(app.getHttpServer())
          .post('/reservations')
          .send({
            deviceId: 'a',
            dateStart: new Date('2020-01-01'),
            dateEnd: new Date('2020-01-03'),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Null device id', () => {
        return request(app.getHttpServer())
          .post('/reservations')
          .send({
            deviceId: null,
            dateStart: new Date('2020-01-01'),
            dateEnd: new Date('2020-01-03'),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Without device id', () => {
        return request(app.getHttpServer())
          .post('/reservations')
          .send({
            dateStart: new Date('2020-01-01'),
            dateEnd: new Date('2020-01-03'),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PUT finish reservation', () => {
    it('Success', () => {
      return request(app.getHttpServer()).put('/reservations/1/status-finish').expect(HttpStatus.OK);
    });

    it('Rejected with unauthorized', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).put('/reservations/1/status-finish').expect(HttpStatus.UNAUTHORIZED);
    });

    describe('Rejected with bad request', () => {
      it('Reservation not found', () => {
        jest.spyOn(reservationsService, 'finishReservation').mockRejectedValueOnce(new ReservationNotFound());
        return request(app.getHttpServer()).put('/reservations/1/status-finish').expect(HttpStatus.BAD_REQUEST);
      });

      it('Reservation wrong status', () => {
        jest.spyOn(reservationsService, 'finishReservation').mockRejectedValueOnce(new ReservationWrongStatus());
        return request(app.getHttpServer()).put('/reservations/1/status-finish').expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PUT approve reservation', () => {
    it('Success', () => {
      return request(app.getHttpServer()).put('/reservations/1/status-approve').expect(HttpStatus.OK);
    });

    it('Rejected with unauthorized', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).put('/reservations/1/status-approve').expect(HttpStatus.UNAUTHORIZED);
    });

    describe('Rejected with bad request', () => {
      it('Reservation not found', () => {
        jest.spyOn(reservationsService, 'approveReservation').mockRejectedValueOnce(new ReservationNotFound());
        return request(app.getHttpServer()).put('/reservations/1/status-approve').expect(HttpStatus.BAD_REQUEST);
      });

      it('Reservation wrong status', () => {
        jest.spyOn(reservationsService, 'approveReservation').mockRejectedValueOnce(new ReservationWrongStatus());
        return request(app.getHttpServer()).put('/reservations/1/status-approve').expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('PUT cancel reservation', () => {
    it('Success', () => {
      return request(app.getHttpServer()).put('/reservations/1/status-cancel').expect(HttpStatus.OK);
    });

    it('Rejected with unauthorized', () => {
      jest.spyOn(guard, 'canActivate').mockRejectedValueOnce(new UnauthorizedException());
      return request(app.getHttpServer()).put('/reservations/1/status-cancel').expect(HttpStatus.UNAUTHORIZED);
    });

    describe('Rejected with bad request', () => {
      it('Reservation not found', () => {
        jest.spyOn(reservationsService, 'cancelReservation').mockRejectedValueOnce(new ReservationNotFound());
        return request(app.getHttpServer()).put('/reservations/1/status-cancel').expect(HttpStatus.BAD_REQUEST);
      });

      it('Reservation wrong status', () => {
        jest.spyOn(reservationsService, 'cancelReservation').mockRejectedValueOnce(new ReservationWrongStatus());
        return request(app.getHttpServer()).put('/reservations/1/status-cancel').expect(HttpStatus.BAD_REQUEST);
      });
    });
  });

  describe('GET users income created reservations', () => {
    it('Empty reservations', () => {
      return request(app.getHttpServer()).get('/reservations/dicapleo/created').expect(HttpStatus.OK).expect([]);
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
      jest.spyOn(reservationsService, 'findUsersIncomeCreatedReservations').mockResolvedValueOnce(reservations);
      return request(app.getHttpServer())
        .get('/reservations/dicapleo/created')
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
      return request(app.getHttpServer()).get('/reservations/dicapleo/created').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET users income in progress reservations', () => {
    it('Empty reservations', () => {
      return request(app.getHttpServer()).get('/reservations/dicapleo/in-progress').expect(HttpStatus.OK).expect([]);
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
      jest.spyOn(reservationsService, 'findUsersIncomeInProgressReservations').mockResolvedValueOnce(reservations);
      return request(app.getHttpServer())
        .get('/reservations/dicapleo/in-progress')
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
      return request(app.getHttpServer()).get('/reservations/dicapleo/in-progress').expect(HttpStatus.UNAUTHORIZED);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
