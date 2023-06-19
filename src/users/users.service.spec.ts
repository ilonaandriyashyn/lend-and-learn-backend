import { ReservationsStatus } from '../reservations/reservations-status';
import { DeepPartial } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { User } from './user.entity';
import { Reservation } from '../reservations/reservations.entity';
import UserDevicesWithTodayReservation from './helpers/user-devices-with-today-reservation';

class UsersRepositoryMock implements Partial<UsersRepository> {
  async findOne(): Promise<User> {
    return new User();
  }
  create(): User;
  create(entityLikeArray: DeepPartial<User>[]): User[];
  create(entityLike: DeepPartial<User>): User;
  create(): User | User[] {
    return new User();
  }
  async save<T extends DeepPartial<User>>(entity: T): Promise<T> {
    return entity;
  }
  async findUserWithCreatedReservations(): Promise<User> {
    return new User();
  }
  async findUserWithInProgressReservations(): Promise<User> {
    return new User();
  }
  async findUserWithOwnedDevicesAndTodayReservation(): Promise<UserDevicesWithTodayReservation> {
    return {
      ownedDevices: [],
      lastName: 'test',
      firstName: 'user',
      username: 'testuser',
      reservations: [],
      email: 'testuser@test.com',
      id: 1,
    };
  }
  async findUserWithOwnedDevicesAndActiveReservations(): Promise<User> {
    return new User();
  }
}

describe('UsersService', () => {
  let usersService: UsersService;
  const repo = new UsersRepositoryMock();
  const httpService = {
    get: () => ({
      toPromise: async () => ({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          username: 'doejohn',
          preferredEmail: 'doejohn@test.com',
        },
      }),
    }),
  };

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    usersService = new UsersService(repo, httpService);
  });

  describe('findOne', () => {
    it('calls findOne', async () => {
      const findOneSpy = jest.spyOn(repo, 'findOne');
      await usersService.findOne('dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith({ username: 'dicapleo' });
    });

    it('returns user', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(user);
      expect(await usersService.findOne('dicapleo')).toBe(user);
    });

    it('returns undefined', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(Promise.resolve(undefined));
      expect(await usersService.findOne('dicapleo')).toBe(undefined);
    });
  });

  describe('updateUser', () => {
    it('throws UnauthorizedException', async () => {
      await expect(usersService.updateUser('dicapleo', 'damonmat', 'access_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('calls http get', async () => {
      const getSpy = jest.spyOn(httpService, 'get');
      await usersService.updateUser('dicapleo', 'dicapleo', 'access_token');
      expect(getSpy).toHaveBeenCalledWith('https://kosapi.fit.cvut.cz/usermap/v1/people/dicapleo', {
        headers: { Authorization: `Bearer access_token` },
      });
    });

    it('throws exception unauthorized', async () => {
      jest.spyOn(httpService, 'get').mockReturnValueOnce({
        toPromise: async () => {
          throw new UnauthorizedException();
        },
      });
      await expect(usersService.updateUser('dicapleo', 'dicapleo', 'access_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('calls findOne', async () => {
      const findOneSpy = jest.spyOn(repo, 'findOne');
      await usersService.updateUser('dicapleo', 'dicapleo', 'access_token');
      expect(findOneSpy).toHaveBeenCalledWith({ username: 'dicapleo' });
    });

    it('returns null', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(Promise.resolve(undefined));
      expect(await usersService.updateUser('dicapleo', 'dicapleo', 'access_token')).toBe(null);
    });

    it('calls save', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(user);
      const saveSpy = jest.spyOn(repo, 'save');
      await usersService.updateUser('dicapleo', 'dicapleo', 'access_token');
      expect(saveSpy).toHaveBeenCalledWith({
        ...user,
        firstName: 'John',
        lastName: 'Doe',
        username: 'doejohn',
        email: 'doejohn@test.com',
      });
    });

    it('returns user', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(repo, 'save').mockResolvedValueOnce({
        ...user,
        firstName: 'John',
        lastName: 'Doe',
        username: 'doejohn',
        email: 'doejohn@test.com',
      });
      expect(await usersService.updateUser('dicapleo', 'dicapleo', 'access_token')).toEqual({
        ...user,
        firstName: 'John',
        lastName: 'Doe',
        username: 'doejohn',
        email: 'doejohn@test.com',
      });
    });
  });

  describe('addNewUser', () => {
    it('calls create', async () => {
      const createSpy = jest.spyOn(repo, 'create');
      await usersService.addNewUser('dicapleo', 'Leo', 'DiCaprio', 'dicapleo@test.com');
      expect(createSpy).toHaveBeenCalledWith({
        username: 'dicapleo',
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
      });
    });

    it('calls save', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(repo, 'create').mockReturnValueOnce(user);
      const saveSpy = jest.spyOn(repo, 'save');
      await usersService.addNewUser('dicapleo', 'Leo', 'DiCaprion', 'dicapleo@test.com');
      expect(saveSpy).toHaveBeenCalledWith(user);
    });

    it('returns created user', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(repo, 'save').mockResolvedValueOnce(user);
      expect(await usersService.addNewUser('dicapleo', 'Leo', 'DiCaprion', 'dicapleo@test.com')).toBe(user);
    });
  });

  describe('findUsersDevices', () => {
    it('throws UnauthorizedException', async () => {
      await expect(usersService.findUsersDevices('dicapleo', 'damonmat', 10, 0)).rejects.toThrow(UnauthorizedException);
    });

    it('calls findUserWithOwnedDevicesAndTodayReservation', async () => {
      const findUserWithOwnedDevicesAndTodayReservationSpy = jest.spyOn(
        repo,
        'findUserWithOwnedDevicesAndTodayReservation',
      );
      await usersService.findUsersDevices('dicapleo', 'dicapleo', 10, 0);
      expect(findUserWithOwnedDevicesAndTodayReservationSpy).toHaveBeenCalledWith('dicapleo');
    });

    it('return default, user is not found', async () => {
      jest.spyOn(repo, 'findUserWithOwnedDevicesAndTodayReservation').mockResolvedValueOnce(undefined);
      expect(await usersService.findUsersDevices('dicapleo', 'dicapleo', 10, 0)).toEqual({ total: 0, results: [] });
    });

    it('return devices', async () => {
      const user: UserDevicesWithTodayReservation = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [
          {
            id: 1,
            name: 'device',
            description: 'description',
            owner: null,
            reservations: [],
            isBookedToday: {
              id: 100,
              status: ReservationsStatus.InProgress,
              user: null,
              device: null,
              dateStart: new Date('2020-01-01'),
              dateEnd: new Date('2020-02-01'),
            } as Reservation,
          },
          {
            id: 2,
            name: 'device2',
            description: 'description2',
            owner: null,
            reservations: [],
            isBookedToday: null,
          },
          {
            id: 3,
            name: 'device2',
            description: 'description2',
            owner: null,
            reservations: [],
            isBookedToday: null,
          },
          {
            id: 4,
            name: 'device2',
            description: 'description2',
            owner: null,
            reservations: [],
            isBookedToday: null,
          },
          {
            id: 5,
            name: 'device2',
            description: 'description2',
            owner: null,
            reservations: [],
            isBookedToday: null,
          },
          {
            id: 6,
            name: 'device2',
            description: 'description2',
            owner: null,
            reservations: [],
            isBookedToday: null,
          },
        ],
        reservations: [],
      };
      jest.spyOn(repo, 'findUserWithOwnedDevicesAndTodayReservation').mockResolvedValue(user);
      expect(await usersService.findUsersDevices('dicapleo', 'dicapleo', 10, 0)).toEqual({
        total: 6,
        results: [
          {
            ...user.ownedDevices[0],
            isBookedToday: true,
          },
          {
            ...user.ownedDevices[1],
            isBookedToday: false,
          },
          {
            ...user.ownedDevices[2],
            isBookedToday: false,
          },
          {
            ...user.ownedDevices[3],
            isBookedToday: false,
          },
          {
            ...user.ownedDevices[4],
            isBookedToday: false,
          },
          {
            ...user.ownedDevices[5],
            isBookedToday: false,
          },
        ],
      });
      expect(await usersService.findUsersDevices('dicapleo', 'dicapleo', 10, 2)).toEqual({
        total: 6,
        results: [
          {
            ...user.ownedDevices[2],
            isBookedToday: false,
          },
          {
            ...user.ownedDevices[3],
            isBookedToday: false,
          },
          {
            ...user.ownedDevices[4],
            isBookedToday: false,
          },
          {
            ...user.ownedDevices[5],
            isBookedToday: false,
          },
        ],
      });
      expect(await usersService.findUsersDevices('dicapleo', 'dicapleo', 2, 3)).toEqual({
        total: 6,
        results: [
          {
            ...user.ownedDevices[3],
            isBookedToday: false,
          },
          {
            ...user.ownedDevices[4],
            isBookedToday: false,
          },
        ],
      });
    });
  });

  describe('findUsersReservationsCreated', () => {
    it('throws UnauthorizedException', async () => {
      await expect(usersService.findUsersReservationsCreated('dicapleo', 'damonmat')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('calls findOne', async () => {
      const findOneSpy = jest.spyOn(repo, 'findOne');
      await usersService.findUsersReservationsCreated('dicapleo', 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith({ username: 'dicapleo' });
    });

    it('return [], user is not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(undefined);
      expect(await usersService.findUsersReservationsCreated('dicapleo', 'dicapleo')).toEqual([]);
    });

    it('calls findUserWithCreatedReservations', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(user);
      const findUserWithCreatedReservationsSpy = jest.spyOn(repo, 'findUserWithCreatedReservations');
      await usersService.findUsersReservationsCreated('dicapleo', 'dicapleo');
      expect(findUserWithCreatedReservationsSpy).toHaveBeenCalledWith('dicapleo');
    });

    it('return reservations', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
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
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(repo, 'findUserWithCreatedReservations').mockResolvedValueOnce(user);
      expect(await usersService.findUsersReservationsCreated('dicapleo', 'dicapleo')).toEqual(user.reservations);
    });
  });

  describe('findUsersReservationsInProgress', () => {
    it('throws UnauthorizedException', async () => {
      await expect(usersService.findUsersReservationsInProgress('dicapleo', 'damonmat')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('calls findOne', async () => {
      const findOneSpy = jest.spyOn(repo, 'findOne');
      await usersService.findUsersReservationsInProgress('dicapleo', 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith({ username: 'dicapleo' });
    });

    it('return [], user is not found', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(undefined);
      expect(await usersService.findUsersReservationsInProgress('dicapleo', 'dicapleo')).toEqual([]);
    });

    it('calls findUserWithInProgressReservations', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(user);
      const findUserWithInProgressReservationsSpy = jest.spyOn(repo, 'findUserWithInProgressReservations');
      await usersService.findUsersReservationsInProgress('dicapleo', 'dicapleo');
      expect(findUserWithInProgressReservationsSpy).toHaveBeenCalledWith('dicapleo');
    });

    it('return reservations', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [
          {
            id: 200,
            dateStart: new Date('2021-01-01'),
            dateEnd: new Date('2021-01-09'),
            status: ReservationsStatus.InProgress,
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
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(repo, 'findUserWithInProgressReservations').mockResolvedValueOnce(user);
      expect(await usersService.findUsersReservationsInProgress('dicapleo', 'dicapleo')).toEqual(user.reservations);
    });
  });

  describe('findUsersDevicesStatistics', () => {
    it('throws UnauthorizedException', async () => {
      await expect(usersService.findUsersDevicesStatistics('dicapleo', 'damonmat')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('calls findUserWithOwnedDevicesAndActiveReservations', async () => {
      const findUserWithOwnedDevicesAndActiveReservationsSpy = jest.spyOn(
        repo,
        'findUserWithOwnedDevicesAndActiveReservations',
      );
      await usersService.findUsersDevicesStatistics('dicapleo', 'dicapleo');
      expect(findUserWithOwnedDevicesAndActiveReservationsSpy).toHaveBeenCalledWith('dicapleo');
    });

    it('returns default object, user is not found', async () => {
      jest.spyOn(repo, 'findUserWithOwnedDevicesAndActiveReservations').mockResolvedValueOnce(undefined);
      expect(await usersService.findUsersDevicesStatistics('dicapleo', 'dicapleo')).toEqual({
        count: 0,
        lent: 0,
        available: 0,
      });
    });

    it('returns statistics', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [
          {
            id: 100,
            name: 'device1',
            description: 'good1',
            owner: null,
            reservations: [
              {
                id: 200,
                dateStart: new Date('2021-01-01'),
                dateEnd: new Date('2021-01-09'),
                status: ReservationsStatus.InProgress,
                user: {
                  id: 300,
                  username: 'damomat',
                  firstName: 'Matt',
                  lastName: 'Damon',
                  email: 'damomat@test.com',
                } as User,
              },
            ] as Reservation[],
          },
          {
            id: 101,
            name: 'device2',
            description: 'good2',
            owner: null,
            reservations: [],
          },
          {
            id: 102,
            name: 'device3',
            description: 'good3',
            owner: null,
            reservations: [],
          },
        ],
        reservations: [],
      };
      jest.spyOn(repo, 'findUserWithOwnedDevicesAndActiveReservations').mockResolvedValueOnce(user);
      expect(await usersService.findUsersDevicesStatistics('dicapleo', 'dicapleo')).toEqual({
        count: 3,
        lent: 1,
        available: 2,
      });
    });

    it('returns statistics with 0', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(repo, 'findUserWithOwnedDevicesAndActiveReservations').mockResolvedValueOnce(user);
      expect(await usersService.findUsersDevicesStatistics('dicapleo', 'dicapleo')).toEqual({
        count: 0,
        lent: 0,
        available: 0,
      });
    });
  });
});
