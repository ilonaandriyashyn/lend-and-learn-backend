import { Connection, Repository } from 'typeorm';
import { newDb } from 'pg-mem';
import { Device } from '../devices/device.entity';
import { DevicesRepository } from '../devices/devices.repository';
import { User } from './user.entity';
import { ReservationsRepository } from '../reservations/reservations.repository';
import { UsersRepository } from './users.repository';
import { Reservation } from '../reservations/reservations.entity';
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

describe('Users Repository', () => {
  let conn: Connection;
  let initPoint;
  let devicesRepository: Repository<Device>;
  let reservationsRepository: Repository<Reservation>;
  let usersRepository: UsersRepository;
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    global.Date = Date;
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
    global.Date = OrigDate;
  });

  beforeEach(() => {
    initPoint.restore();
  });

  it('findUserWithCreatedReservations', async () => {
    expect(await usersRepository.findUserWithCreatedReservations('testuser')).toEqual({
      ...users[1],
      reservations: [
        {
          dateStart: reservations[3].dateStart.toISOString().slice(0, 10),
          dateEnd: reservations[3].dateEnd.toISOString().slice(0, 10),
          status: reservations[3].status,
          id: reservations[3].id,
          device: reservations[3].device,
        },
        {
          dateStart: reservations[0].dateStart.toISOString().slice(0, 10),
          dateEnd: reservations[0].dateEnd.toISOString().slice(0, 10),
          status: reservations[0].status,
          id: reservations[0].id,
          device: reservations[0].device,
        },
        {
          dateStart: reservations[1].dateStart.toISOString().slice(0, 10),
          dateEnd: reservations[1].dateEnd.toISOString().slice(0, 10),
          status: reservations[1].status,
          id: reservations[1].id,
          device: reservations[1].device,
        },
        {
          dateStart: reservations[2].dateStart.toISOString().slice(0, 10),
          dateEnd: reservations[2].dateEnd.toISOString().slice(0, 10),
          status: reservations[2].status,
          id: reservations[2].id,
          device: reservations[2].device,
        },
      ],
    });
    expect(await usersRepository.findUserWithCreatedReservations('doejohn')).toEqual({
      ...users[0],
      reservations: [],
    });
    expect(await usersRepository.findUserWithCreatedReservations('unknown')).toBe(undefined);
  });

  it('findUserWithInProgressReservations', async () => {
    expect(await usersRepository.findUserWithInProgressReservations('testuser')).toEqual({
      ...users[1],
      reservations: [
        {
          dateStart: reservations[4].dateStart.toISOString().slice(0, 10),
          dateEnd: reservations[4].dateEnd.toISOString().slice(0, 10),
          status: reservations[4].status,
          id: reservations[4].id,
          device: reservations[4].device,
        },
        {
          dateStart: reservations[7].dateStart.toISOString().slice(0, 10),
          dateEnd: reservations[7].dateEnd.toISOString().slice(0, 10),
          status: reservations[7].status,
          id: reservations[7].id,
          device: reservations[7].device,
        },
      ],
    });
    expect(await usersRepository.findUserWithInProgressReservations('doejohn')).toEqual({
      ...users[0],
      reservations: [],
    });
    expect(await usersRepository.findUserWithInProgressReservations('unknown')).toBe(undefined);
  });

  it('findUserWithOwnedDevicesAndTodayReservation', async () => {
    expect(await usersRepository.findUserWithOwnedDevicesAndTodayReservation('doejohn')).toEqual({
      ...users[0],
      ownedDevices: [
        {
          ...devices[0],
          isBookedToday: {
            dateStart: reservations[4].dateStart.toISOString().slice(0, 10),
            dateEnd: reservations[4].dateEnd.toISOString().slice(0, 10),
            status: reservations[4].status,
            id: reservations[4].id,
          },
          reservations: [
            {
              dateStart: reservations[4].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[4].dateEnd.toISOString().slice(0, 10),
              status: reservations[4].status,
              id: reservations[4].id,
            },
            {
              dateStart: reservations[0].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[0].dateEnd.toISOString().slice(0, 10),
              status: reservations[0].status,
              id: reservations[0].id,
            },
            {
              dateStart: reservations[1].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[1].dateEnd.toISOString().slice(0, 10),
              status: reservations[1].status,
              id: reservations[1].id,
            },
            {
              dateStart: reservations[2].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[2].dateEnd.toISOString().slice(0, 10),
              status: reservations[2].status,
              id: reservations[2].id,
            },
          ],
        },
        {
          ...devices[1],
          isBookedToday: null,
          reservations: [
            {
              dateStart: reservations[3].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[3].dateEnd.toISOString().slice(0, 10),
              status: reservations[3].status,
              id: reservations[3].id,
            },
            {
              dateStart: reservations[7].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[7].dateEnd.toISOString().slice(0, 10),
              status: reservations[7].status,
              id: reservations[7].id,
            },
          ],
        },
      ],
    });
    expect(await usersRepository.findUserWithOwnedDevicesAndTodayReservation('testuser')).toEqual({
      ...users[1],
      ownedDevices: [],
    });
    expect(await usersRepository.findUserWithOwnedDevicesAndTodayReservation('unknown')).toBe(undefined);
  });

  it('findUserWithOwnedDevicesAndActiveReservations', async () => {
    expect(await usersRepository.findUserWithOwnedDevicesAndActiveReservations('doejohn')).toEqual({
      ...users[0],
      ownedDevices: [
        {
          id: devices[0].id,
          name: devices[0].name,
          description: devices[0].description,
          reservations: [
            {
              dateStart: reservations[4].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[4].dateEnd.toISOString().slice(0, 10),
              status: reservations[4].status,
              id: reservations[4].id,
            },
            {
              dateStart: reservations[0].dateStart.toISOString().slice(0, 10),
              dateEnd: reservations[0].dateEnd.toISOString().slice(0, 10),
              status: reservations[0].status,
              id: reservations[0].id,
            },
          ],
        },
        {
          id: devices[1].id,
          name: devices[1].name,
          description: devices[1].description,
          reservations: [],
        },
      ],
    });
    expect(await usersRepository.findUserWithOwnedDevicesAndActiveReservations('testuser')).toEqual({
      ...users[1],
      ownedDevices: [],
    });
    expect(await usersRepository.findUserWithOwnedDevicesAndActiveReservations('unknown')).toBe(undefined);
  });
});
