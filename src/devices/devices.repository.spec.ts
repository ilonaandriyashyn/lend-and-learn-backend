import { Connection } from 'typeorm';
import { Device } from './device.entity';
import { User } from '../users/user.entity';
import { Reservation } from '../reservations/reservations.entity';
import { newDb } from 'pg-mem';
import { DevicesRepository } from './devices.repository';
import { ReservationsRepository } from '../reservations/reservations.repository';
import { UsersRepository } from '../users/users.repository';
import { ReservationsStatus } from '../reservations/reservations-status';

const OrigDate = global.Date;

class Date extends OrigDate {
  constructor(...args) {
    if (args.length === 0) {
      super('2020-01-01');
    } else if (args.length === 1) {
      super(args[0]);
    } else {
      super(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
    }
  }
}

describe('Devices Repository', () => {
  let conn: Connection;
  let initPoint;

  beforeAll(async () => {
    const db = newDb({
      autoCreateForeignKeyIndices: true,
    });
    conn = await db.adapters.createTypeormConnection({
      type: 'postgres',
      entities: [Device, User, Reservation],
    });
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.Date = Date;
    await conn.synchronize();
    initPoint = db.backup();
  });

  afterAll(async () => {
    await conn.close();
    global.Date = OrigDate;
  });

  beforeEach(() => {
    initPoint.restore();
  });

  it('findDevicesWithActiveReservations', async () => {
    const devicesRepository = conn.getCustomRepository(DevicesRepository);
    const reservationsRepository = conn.getCustomRepository(ReservationsRepository);
    const usersRepository = conn.getCustomRepository(UsersRepository);
    const users = [
      usersRepository.create({
        username: 'dicapleo',
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
      }),
      usersRepository.create({
        username: 'damomat',
        firstName: 'Matt',
        lastName: 'Damon',
        email: 'damomat@test.com',
      }),
      usersRepository.create({
        username: 'hardytom',
        firstName: 'Tom',
        lastName: 'Hardy',
        email: 'hardytom@test.com',
      }),
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
    const devices = [
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
      devicesRepository.create({
        name: 'device3',
        description: 'good3',
        owner: users[1],
      }),
    ];
    await devicesRepository.insert(devices);
    const reservations = [
      reservationsRepository.create({
        dateStart: new Date('2020-01-01'),
        dateEnd: new Date('2020-01-01'),
        status: ReservationsStatus.Created,
        device: devices[0],
        user: users[2],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-02'),
        dateEnd: new Date('2020-01-02'),
        status: ReservationsStatus.Created,
        device: devices[0],
        user: users[3],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-03'),
        dateEnd: new Date('2020-01-03'),
        status: ReservationsStatus.Created,
        device: devices[0],
        user: users[3],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-04'),
        dateEnd: new Date('2020-01-04'),
        status: ReservationsStatus.Created,
        device: devices[1],
        user: users[3],
      }),
      reservationsRepository.create({
        dateStart: new Date('2019-12-01'),
        dateEnd: new Date('2020-01-04'),
        status: ReservationsStatus.InProgress,
        device: devices[1],
        user: users[2],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-06'),
        dateEnd: new Date('2020-01-06'),
        status: ReservationsStatus.Cancelled,
        device: devices[1],
        user: users[4],
      }),
      reservationsRepository.create({
        dateStart: new Date('2019-12-07'),
        dateEnd: new Date('2021-01-07'),
        status: ReservationsStatus.Finished,
        device: devices[2],
        user: users[3],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-08'),
        dateEnd: new Date('2020-01-08'),
        status: ReservationsStatus.InProgress,
        device: devices[2],
        user: users[4],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-01'),
        dateEnd: new Date('2020-01-01'),
        status: ReservationsStatus.Cancelled,
        device: devices[2],
        user: users[4],
      }),
    ];
    await reservationsRepository.insert(reservations);
    expect(await devicesRepository.findDevicesWithActiveReservations(10, 0)).toEqual([
      [
        {
          ...devices[0],
          reservations: [
            {
              id: reservations[0].id,
              dateStart: reservations[0].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[0].dateEnd.toISOString().slice(0, 10),
              status: reservations[0].status,
            },
            {
              id: reservations[1].id,
              dateStart: reservations[1].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[1].dateEnd.toISOString().slice(0, 10),
              status: reservations[1].status,
            },
            {
              id: reservations[2].id,
              dateStart: reservations[2].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[2].dateEnd.toISOString().slice(0, 10),
              status: reservations[2].status,
            },
          ],
          isBookedToday: {
            id: reservations[0].id,
            dateStart: reservations[0].dateStart.toISOString().slice(0, 10),
            dateEnd: reservations[0].dateEnd.toISOString().slice(0, 10),
            status: reservations[0].status,
          },
        },
        {
          ...devices[1],
          reservations: [
            {
              id: reservations[3].id,
              dateStart: reservations[3].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[3].dateEnd.toISOString().slice(0, 10),
              status: reservations[3].status,
            },
            {
              id: reservations[4].id,
              dateStart: reservations[4].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[4].dateEnd.toISOString().slice(0, 10),
              status: reservations[4].status,
            },
          ],
          isBookedToday: {
            id: reservations[4].id,
            dateStart: reservations[4].dateStart.toISOString().slice(0, 10),
            dateEnd: reservations[4].dateEnd.toISOString().slice(0, 10),
            status: reservations[4].status,
          },
        },
        {
          ...devices[2],
          reservations: [
            {
              id: reservations[7].id,
              dateStart: reservations[7].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[7].dateEnd.toISOString().slice(0, 10),
              status: reservations[7].status,
            },
          ],
          isBookedToday: null,
        },
      ],
      3,
    ]);
    expect(await devicesRepository.findDevicesWithActiveReservations(1, 0)).toEqual([
      [
        {
          ...devices[0],
          reservations: [
            {
              id: reservations[0].id,
              dateStart: reservations[0].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[0].dateEnd.toISOString().slice(0, 10),
              status: reservations[0].status,
            },
            {
              id: reservations[1].id,
              dateStart: reservations[1].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[1].dateEnd.toISOString().slice(0, 10),
              status: reservations[1].status,
            },
            {
              id: reservations[2].id,
              dateStart: reservations[2].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[2].dateEnd.toISOString().slice(0, 10),
              status: reservations[2].status,
            },
          ],
          isBookedToday: {
            id: reservations[0].id,
            dateStart: reservations[0].dateStart.toISOString().slice(0, 10),
            dateEnd: reservations[0].dateEnd.toISOString().slice(0, 10),
            status: reservations[0].status,
          },
        },
      ],
      3,
    ]);
    expect(await devicesRepository.findDevicesWithActiveReservations(10, 2)).toEqual([
      [
        {
          ...devices[2],
          reservations: [
            {
              id: reservations[7].id,
              dateStart: reservations[7].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[7].dateEnd.toISOString().slice(0, 10),
              status: reservations[7].status,
            },
          ],
          isBookedToday: null,
        },
      ],
      3,
    ]);
  });

  it('findDeviceWithActiveReservationsAndOwner', async () => {
    const devicesRepository = conn.getCustomRepository(DevicesRepository);
    const reservationsRepository = conn.getCustomRepository(ReservationsRepository);
    const usersRepository = conn.getCustomRepository(UsersRepository);
    const users = [
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
    const devices = [
      devicesRepository.create({
        name: 'device1',
        description: 'good1',
        owner: users[0],
      }),
    ];
    await devicesRepository.insert(devices);
    const reservations = [
      reservationsRepository.create({
        dateStart: new Date('2020-01-01'),
        dateEnd: new Date('2020-01-01'),
        status: ReservationsStatus.Created,
        device: devices[0],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-02'),
        dateEnd: new Date('2020-01-02'),
        status: ReservationsStatus.Created,
        device: devices[0],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-03'),
        dateEnd: new Date('2020-01-03'),
        status: ReservationsStatus.Created,
        device: devices[0],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-03'),
        dateEnd: new Date('2020-01-03'),
        status: ReservationsStatus.Finished,
        device: devices[0],
        user: users[1],
      }),
      reservationsRepository.create({
        dateStart: new Date('2020-01-03'),
        dateEnd: new Date('2020-01-03'),
        status: ReservationsStatus.Cancelled,
        device: devices[0],
        user: users[1],
      }),
    ];
    await reservationsRepository.insert(reservations);
    expect(await devicesRepository.findDeviceWithActiveReservationsAndOwner(devices[0].id)).toEqual({
      ...devices[0],
      reservations: [
        {
          id: reservations[0].id,
          dateStart: reservations[0].dateStart.toISOString().slice(0, 10),
          dateEnd: reservations[0].dateEnd.toISOString().slice(0, 10),
          status: reservations[0].status,
        },
        {
          id: reservations[1].id,
          dateStart: reservations[1].dateStart.toISOString().slice(0, 10),
          dateEnd: reservations[1].dateEnd.toISOString().slice(0, 10),
          status: reservations[1].status,
        },
        {
          id: reservations[2].id,
          dateStart: reservations[2].dateStart.toISOString().slice(0, 10),
          dateEnd: reservations[2].dateEnd.toISOString().slice(0, 10),
          status: reservations[2].status,
        },
      ],
    });
    expect(await devicesRepository.findDeviceWithActiveReservationsAndOwner(200)).toEqual(undefined);
  });
});
