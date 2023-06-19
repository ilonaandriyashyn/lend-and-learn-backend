import { Connection, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { newDb } from 'pg-mem';
import { UsersRepository } from '../users/users.repository';
import { Device } from '../devices/device.entity';
import { Reservation } from './reservations.entity';
import { ReservationsRepository } from './reservations.repository';
import { DevicesRepository } from '../devices/devices.repository';
import { ReservationsStatus } from './reservations-status';

describe('Reservations Repository', () => {
  let conn: Connection;
  let initPoint;
  let devicesRepository: Repository<Device>;
  let reservationsRepository: ReservationsRepository;
  let usersRepository: Repository<User>;
  let users = [];
  let devices = [];
  let reservations = [];

  beforeAll(async () => {
    const db = newDb({
      autoCreateForeignKeyIndices: true,
    });
    conn = await db.adapters.createTypeormConnection({
      type: 'postgres',
      entities: [Device, User, Reservation],
    });
    await conn.synchronize();
    devicesRepository = conn.getCustomRepository(DevicesRepository);
    reservationsRepository = conn.getCustomRepository(ReservationsRepository);
    usersRepository = conn.getCustomRepository(UsersRepository);
    users = [
      usersRepository.create({
        username: 'doejohn',
        firstName: 'John',
        lastName: 'Doe',
        email: 'doejohn@test.com',
      }),
      usersRepository.create({
        username: 'testuser',
        firstName: 'User',
        lastName: 'Test',
        email: 'testuser@test.com',
      }),
    ];
    await usersRepository.insert(users);
    devices = [
      devicesRepository.create({
        name: 'device1',
        description: 'good1',
        owner: users[0],
      }),
      devicesRepository.create({
        name: 'device2',
        description: 'good2',
        owner: users[0],
      }),
    ];
    await devicesRepository.insert(devices);
    reservations = [
      reservationsRepository.create({
        dateStart: new Date('2020-01-01'),
        dateEnd: new Date('2020-01-10'),
        status: ReservationsStatus.Created,
        device: devices[0],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-02-02'),
        dateEnd: new Date('2020-02-02'),
        status: ReservationsStatus.Created,
        device: devices[0],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-03-03'),
        dateEnd: new Date('2020-03-03'),
        status: ReservationsStatus.Created,
        device: devices[0],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-04-04'),
        dateEnd: new Date('2020-04-04'),
        status: ReservationsStatus.Created,
        device: devices[1],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2019-12-01'),
        dateEnd: new Date('2020-01-04'),
        status: ReservationsStatus.InProgress,
        device: devices[0],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-06-06'),
        dateEnd: new Date('2020-06-06'),
        status: ReservationsStatus.Cancelled,
        device: devices[1],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2019-12-07'),
        dateEnd: new Date('2021-01-07'),
        status: ReservationsStatus.Finished,
        device: devices[0],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-08-08'),
        dateEnd: new Date('2020-08-08'),
        status: ReservationsStatus.InProgress,
        device: devices[1],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-01'),
        dateEnd: new Date('2020-01-01'),
        status: ReservationsStatus.Cancelled,
        device: devices[1],
        user: users[1],
      }),
    ];
    await reservationsRepository.insert(reservations);
    initPoint = db.backup();
  });

  afterAll(async () => {
    await conn.close();
  });

  beforeEach(() => {
    initPoint.restore();
  });

  it('countCollisions', async () => {
    expect(
      await reservationsRepository.countCollisions(new Date('2020-01-01'), new Date('2020-01-01'), devices[0].id),
    ).toEqual(2);
    expect(
      await reservationsRepository.countCollisions(new Date('2020-01-01'), new Date('2020-01-01'), devices[1].id),
    ).toEqual(0);
    expect(
      await reservationsRepository.countCollisions(new Date('2018-01-01'), new Date('2020-02-18'), devices[0].id),
    ).toEqual(3);
    expect(
      await reservationsRepository.countCollisions(new Date('2020-01-05'), new Date('2020-01-06'), devices[0].id),
    ).toEqual(1);
  });

  it('findIncomeCreatedReservations', async () => {
    expect(await reservationsRepository.findIncomeCreatedReservations('doejohn')).toEqual([
      {
        id: reservations[3].id,
        dateStart: reservations[3].dateStart.toISOString().slice(0, 10),
        dateEnd: reservations[3].dateEnd.toISOString().slice(0, 10),
        status: reservations[3].status,
        device: {
          id: devices[1].id,
          name: devices[1].name,
          description: devices[1].description,
        },
        user: {
          id: users[1].id,
          firstName: users[1].firstName,
          lastName: users[1].lastName,
          email: users[1].email,
          username: users[1].username,
        },
      },
      {
        id: reservations[0].id,
        dateStart: reservations[0].dateStart.toISOString().slice(0, 10),
        dateEnd: reservations[0].dateEnd.toISOString().slice(0, 10),
        status: reservations[0].status,
        device: {
          id: devices[0].id,
          name: devices[0].name,
          description: devices[0].description,
        },
        user: {
          id: users[1].id,
          firstName: users[1].firstName,
          lastName: users[1].lastName,
          email: users[1].email,
          username: users[1].username,
        },
      },
      {
        id: reservations[1].id,
        dateStart: reservations[1].dateStart.toISOString().slice(0, 10),
        dateEnd: reservations[1].dateEnd.toISOString().slice(0, 10),
        status: reservations[1].status,
        device: {
          id: devices[0].id,
          name: devices[0].name,
          description: devices[0].description,
        },
        user: {
          id: users[1].id,
          firstName: users[1].firstName,
          lastName: users[1].lastName,
          email: users[1].email,
          username: users[1].username,
        },
      },
      {
        id: reservations[2].id,
        dateStart: reservations[2].dateStart.toISOString().slice(0, 10),
        dateEnd: reservations[2].dateEnd.toISOString().slice(0, 10),
        status: reservations[2].status,
        device: {
          id: devices[0].id,
          name: devices[0].name,
          description: devices[0].description,
        },
        user: {
          id: users[1].id,
          firstName: users[1].firstName,
          lastName: users[1].lastName,
          email: users[1].email,
          username: users[1].username,
        },
      },
    ]);
    expect(await reservationsRepository.findIncomeCreatedReservations('unknown')).toEqual([]);
    expect(await reservationsRepository.findIncomeCreatedReservations('testuser')).toEqual([]);
  });

  it('findIncomeInProgressReservations', async () => {
    expect(await reservationsRepository.findIncomeInProgressReservations('doejohn')).toEqual([
      {
        id: reservations[4].id,
        dateStart: reservations[4].dateStart.toISOString().slice(0, 10),
        dateEnd: reservations[4].dateEnd.toISOString().slice(0, 10),
        status: reservations[4].status,
        device: {
          id: devices[0].id,
          name: devices[0].name,
          description: devices[0].description,
        },
        user: {
          id: users[1].id,
          firstName: users[1].firstName,
          lastName: users[1].lastName,
          email: users[1].email,
          username: users[1].username,
        },
      },
      {
        id: reservations[7].id,
        dateStart: reservations[7].dateStart.toISOString().slice(0, 10),
        dateEnd: reservations[7].dateEnd.toISOString().slice(0, 10),
        status: reservations[7].status,
        device: {
          id: devices[1].id,
          name: devices[1].name,
          description: devices[1].description,
        },
        user: {
          id: users[1].id,
          firstName: users[1].firstName,
          lastName: users[1].lastName,
          email: users[1].email,
          username: users[1].username,
        },
      },
    ]);
    expect(await reservationsRepository.findIncomeInProgressReservations('unknown')).toEqual([]);
    expect(await reservationsRepository.findIncomeInProgressReservations('testuser')).toEqual([]);
  });
});
