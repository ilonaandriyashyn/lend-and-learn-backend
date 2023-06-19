import { DeepPartial } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { ReservationsRepository } from './reservations.repository';
import { Reservation } from './reservations.entity';
import { ReservationsService } from './reservations.service';
import { ReservationCollision } from '../exceptions/reservation-collision';
import { UserNotFound } from '../exceptions/user-not-found';
import { User } from '../users/user.entity';
import { Device } from '../devices/device.entity';
import { DeviceNotFound } from '../exceptions/device-not-found';
import { ReservationsStatus } from './reservations-status';
import { ReservationNotFound } from '../exceptions/reservation-not-found';
import { ReservationWrongStatus } from '../exceptions/reservation-wrong-status';

class ReservationsRepositoryMock implements Partial<ReservationsRepository> {
  async findOne(): Promise<Reservation> {
    return new Reservation();
  }
  async countCollisions(): Promise<number> {
    return 0;
  }
  create(): Reservation;
  create(entityLikeArray: DeepPartial<Reservation>[]): Reservation[];
  create(entityLike: DeepPartial<Reservation>): Reservation;
  create(): Reservation | Reservation[] {
    return new Reservation();
  }
  async save<T extends DeepPartial<Reservation>>(entity: T): Promise<T> {
    return entity;
  }
  async findIncomeCreatedReservations(): Promise<Reservation[]> {
    return [];
  }
  async findIncomeInProgressReservations(): Promise<Reservation[]> {
    return [];
  }
}

describe('ReservationsService', () => {
  let reservationsService: ReservationsService;
  const repo = new ReservationsRepositoryMock();
  const usersService = {
    findOne: async (): Promise<User> => new User(),
  };
  const devicesService = {
    findOne: async (): Promise<Device> => new Device(),
  };

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    reservationsService = new ReservationsService(repo, usersService, devicesService);
  });

  describe('addNewReservation', () => {
    it('calls countCollisions', async () => {
      const countCollisionsSpy = jest.spyOn(repo, 'countCollisions');
      await reservationsService.addNewReservation(new Date('2020-01-01'), new Date('2021-01-01'), 1, 'dicapleo');
      expect(countCollisionsSpy).toHaveBeenCalledWith(new Date('2020-01-01'), new Date('2021-01-01'), 1);
    });

    it('throws ReservationCollision', async () => {
      jest.spyOn(repo, 'countCollisions').mockResolvedValueOnce(1);
      await expect(
        reservationsService.addNewReservation(new Date('2020-01-01'), new Date('2021-01-01'), 1, 'dicapleo'),
      ).rejects.toThrow(ReservationCollision);
    });

    it('calls user service findOne', async () => {
      const findOneSpy = jest.spyOn(usersService, 'findOne');
      await reservationsService.addNewReservation(new Date('2020-01-01'), new Date('2021-01-01'), 1, 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith('dicapleo');
    });

    it('throws UserNotFound', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined);
      await expect(
        reservationsService.addNewReservation(new Date('2020-01-01'), new Date('2021-01-01'), 1, 'dicapleo'),
      ).rejects.toThrow(UserNotFound);
    });

    it('calls device service findOne', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user);
      const findOneSpy = jest.spyOn(devicesService, 'findOne');
      await reservationsService.addNewReservation(new Date('2020-01-01'), new Date('2021-01-01'), 1, 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith(1);
    });

    it('throws DeviceNotFound', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(devicesService, 'findOne').mockResolvedValueOnce(undefined);
      await expect(
        reservationsService.addNewReservation(new Date('2020-01-01'), new Date('2021-01-01'), 1, 'dicapleo'),
      ).rejects.toThrow(DeviceNotFound);
    });

    it('calls create', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
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
        reservations: [],
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(devicesService, 'findOne').mockResolvedValueOnce(device);
      const createSpy = jest.spyOn(repo, 'create');
      await reservationsService.addNewReservation(new Date('2020-01-01'), new Date('2021-01-01'), 1, 'dicapleo');
      expect(createSpy).toHaveBeenCalledWith({
        dateStart: new Date('2020-01-01'),
        dateEnd: new Date('2021-01-01'),
        device,
        user,
      });
    });

    it('calls save', async () => {
      const reservation: Reservation = {
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
        device: null,
      };
      jest.spyOn(repo, 'create').mockReturnValueOnce(reservation);
      const saveSpy = jest.spyOn(repo, 'save');
      await reservationsService.addNewReservation(new Date('2020-01-01'), new Date('2021-01-01'), 1, 'dicapleo');
      expect(saveSpy).toHaveBeenCalledWith(reservation);
    });

    it('returns created user', async () => {
      const reservation: Reservation = {
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
        device: null,
      };
      jest.spyOn(repo, 'create').mockReturnValueOnce(reservation);
      jest.spyOn(repo, 'save').mockResolvedValueOnce(reservation);
      expect(
        await reservationsService.addNewReservation(new Date('2020-01-01'), new Date('2021-01-01'), 1, 'dicapleo'),
      ).toBe(reservation);
    });
  });

  describe('finishReservation', () => {
    it('calls findOne', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.InProgress,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await reservationsService.finishReservation(1, 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith(1, { relations: ['device', 'device.owner'] });
    });

    it('throws ReservationNotFound', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(undefined);
      await expect(reservationsService.finishReservation(1, 'dicapleo')).rejects.toThrow(ReservationNotFound);
    });

    it('throws UnauthorizedException', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.InProgress,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'damomat',
            firstName: 'Matt',
            lastName: 'Damon',
            email: 'damomat@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await expect(reservationsService.finishReservation(1, 'dicapleo')).rejects.toThrow(UnauthorizedException);
    });

    it('throws ReservationWrongStatus', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await expect(reservationsService.finishReservation(1, 'dicapleo')).rejects.toThrow(ReservationWrongStatus);
    });

    it('calls save', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.InProgress,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      const saveSpy = jest.spyOn(repo, 'save');
      await reservationsService.finishReservation(1, 'dicapleo');
      expect(saveSpy).toHaveBeenCalledWith({
        ...reservation,
        status: ReservationsStatus.Finished,
      });
    });

    it('returns reservation', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.InProgress,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      jest.spyOn(repo, 'save').mockResolvedValueOnce({
        ...reservation,
        status: ReservationsStatus.Finished,
      });
      expect(await reservationsService.finishReservation(1, 'dicapleo')).toEqual({
        ...reservation,
        status: ReservationsStatus.Finished,
      });
    });
  });

  describe('approveReservation', () => {
    it('calls findOne', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await reservationsService.approveReservation(1, 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith(1, { relations: ['device', 'device.owner'] });
    });

    it('throws ReservationNotFound', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(undefined);
      await expect(reservationsService.approveReservation(1, 'dicapleo')).rejects.toThrow(ReservationNotFound);
    });

    it('throws UnauthorizedException', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'damomat',
            firstName: 'Matt',
            lastName: 'Damon',
            email: 'damomat@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await expect(reservationsService.approveReservation(1, 'dicapleo')).rejects.toThrow(UnauthorizedException);
    });

    it('throws ReservationWrongStatus', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.InProgress,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await expect(reservationsService.approveReservation(1, 'dicapleo')).rejects.toThrow(ReservationWrongStatus);
    });

    it('calls save', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      const saveSpy = jest.spyOn(repo, 'save');
      await reservationsService.approveReservation(1, 'dicapleo');
      expect(saveSpy).toHaveBeenCalledWith({
        ...reservation,
        status: ReservationsStatus.InProgress,
      });
    });

    it('returns reservation', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      jest.spyOn(repo, 'save').mockResolvedValueOnce({
        ...reservation,
        status: ReservationsStatus.InProgress,
      });
      expect(await reservationsService.approveReservation(1, 'dicapleo')).toEqual({
        ...reservation,
        status: ReservationsStatus.InProgress,
      });
    });
  });

  describe('cancelReservation', () => {
    it('calls findOne', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await reservationsService.cancelReservation(1, 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith(1, { relations: ['user', 'device', 'device.owner'] });
    });

    it('throws ReservationNotFound', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(undefined);
      await expect(reservationsService.cancelReservation(1, 'dicapleo')).rejects.toThrow(ReservationNotFound);
    });

    it('throws UnauthorizedException', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'damomat',
            firstName: 'Matt',
            lastName: 'Damon',
            email: 'damomat@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await expect(reservationsService.cancelReservation(1, 'dicapleo')).rejects.toThrow(UnauthorizedException);
    });

    it('throws ReservationWrongStatus', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.InProgress,
        user: {
          id: 500,
          username: 'dicapleo',
          firstName: 'Leo',
          lastName: 'DiCaprio',
          email: 'dicapleo@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 300,
            username: 'doejohn',
            firstName: 'John',
            lastName: 'Doe',
            email: 'doejohn@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await expect(reservationsService.cancelReservation(1, 'dicapleo')).rejects.toThrow(ReservationWrongStatus);
    });

    it('calls save', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      const saveSpy = jest.spyOn(repo, 'save');
      await reservationsService.cancelReservation(1, 'dicapleo');
      expect(saveSpy).toHaveBeenCalledWith({
        ...reservation,
        status: ReservationsStatus.Cancelled,
      });
    });

    it('returns reservation', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      jest.spyOn(repo, 'save').mockResolvedValueOnce({
        ...reservation,
        status: ReservationsStatus.Cancelled,
      });
      expect(await reservationsService.cancelReservation(1, 'dicapleo')).toEqual({
        ...reservation,
        status: ReservationsStatus.Cancelled,
      });
    });
  });

  describe('approveReservation', () => {
    it('calls findOne', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await reservationsService.approveReservation(1, 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith(1, { relations: ['device', 'device.owner'] });
    });

    it('throws ReservationNotFound', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(undefined);
      await expect(reservationsService.approveReservation(1, 'dicapleo')).rejects.toThrow(ReservationNotFound);
    });

    it('throws UnauthorizedException', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'damomat',
            firstName: 'Matt',
            lastName: 'Damon',
            email: 'damomat@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await expect(reservationsService.approveReservation(1, 'dicapleo')).rejects.toThrow(UnauthorizedException);
    });

    it('throws ReservationWrongStatus', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.InProgress,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      await expect(reservationsService.approveReservation(1, 'dicapleo')).rejects.toThrow(ReservationWrongStatus);
    });

    it('calls save', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      const saveSpy = jest.spyOn(repo, 'save');
      await reservationsService.approveReservation(1, 'dicapleo');
      expect(saveSpy).toHaveBeenCalledWith({
        ...reservation,
        status: ReservationsStatus.InProgress,
      });
    });

    it('returns reservation', async () => {
      const reservation: Reservation = {
        id: 200,
        dateStart: new Date('2021-01-01'),
        dateEnd: new Date('2021-01-09'),
        status: ReservationsStatus.Created,
        user: {
          id: 300,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        device: {
          id: 400,
          name: 'device',
          description: 'good',
          reservations: [],
          owner: {
            id: 500,
            username: 'dicapleo',
            firstName: 'Leo',
            lastName: 'DiCaprio',
            email: 'dicapleo@test.com',
          } as User,
        } as Device,
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(reservation);
      jest.spyOn(repo, 'save').mockResolvedValueOnce({
        ...reservation,
        status: ReservationsStatus.InProgress,
      });
      expect(await reservationsService.approveReservation(1, 'dicapleo')).toEqual({
        ...reservation,
        status: ReservationsStatus.InProgress,
      });
    });
  });

  describe('findUsersIncomeCreatedReservations', () => {
    it('throws UnauthorizedException', async () => {
      await expect(reservationsService.findUsersIncomeCreatedReservations('dicapleo', 'damonmat')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('calls findIncomeCreatedReservations', async () => {
      const findIncomeCreatedReservationsSpy = jest.spyOn(repo, 'findIncomeCreatedReservations');
      await reservationsService.findUsersIncomeCreatedReservations('dicapleo', 'dicapleo');
      expect(findIncomeCreatedReservationsSpy).toHaveBeenCalledWith('dicapleo');
    });

    it('returns empty array', async () => {
      expect(await reservationsService.findUsersIncomeCreatedReservations('dicapleo', 'dicapleo')).toEqual([]);
    });

    it('returns reservations', async () => {
      const reservations: Reservation[] = [
        {
          id: 200,
          dateStart: new Date('2021-01-01'),
          dateEnd: new Date('2021-01-09'),
          status: ReservationsStatus.Created,
          user: {
            id: 300,
            username: 'doejohn',
            firstName: 'John',
            lastName: 'Doe',
            email: 'doejohn@test.com',
          } as User,
          device: {
            id: 400,
            name: 'device',
            description: 'good',
            reservations: [],
            owner: {
              id: 500,
              username: 'dicapleo',
              firstName: 'Leo',
              lastName: 'DiCaprio',
              email: 'dicapleo@test.com',
            } as User,
          } as Device,
        },
      ];
      jest.spyOn(repo, 'findIncomeCreatedReservations').mockResolvedValueOnce(reservations);
      expect(await reservationsService.findUsersIncomeCreatedReservations('dicapleo', 'dicapleo')).toBe(reservations);
    });
  });

  describe('findUsersIncomeInProgressReservations', () => {
    it('throws UnauthorizedException', async () => {
      await expect(reservationsService.findUsersIncomeInProgressReservations('dicapleo', 'damonmat')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('calls findIncomeInProgressReservations', async () => {
      const findIncomeInProgressReservationsSpy = jest.spyOn(repo, 'findIncomeInProgressReservations');
      await reservationsService.findUsersIncomeInProgressReservations('dicapleo', 'dicapleo');
      expect(findIncomeInProgressReservationsSpy).toHaveBeenCalledWith('dicapleo');
    });

    it('returns empty array', async () => {
      expect(await reservationsService.findUsersIncomeInProgressReservations('dicapleo', 'dicapleo')).toEqual([]);
    });

    it('returns reservations', async () => {
      const reservations: Reservation[] = [
        {
          id: 200,
          dateStart: new Date('2021-01-01'),
          dateEnd: new Date('2021-01-09'),
          status: ReservationsStatus.InProgress,
          user: {
            id: 300,
            username: 'doejohn',
            firstName: 'John',
            lastName: 'Doe',
            email: 'doejohn@test.com',
          } as User,
          device: {
            id: 400,
            name: 'device',
            description: 'good',
            reservations: [],
            owner: {
              id: 500,
              username: 'dicapleo',
              firstName: 'Leo',
              lastName: 'DiCaprio',
              email: 'dicapleo@test.com',
            } as User,
          } as Device,
        },
      ];
      jest.spyOn(repo, 'findIncomeInProgressReservations').mockResolvedValueOnce(reservations);
      expect(await reservationsService.findUsersIncomeInProgressReservations('dicapleo', 'dicapleo')).toBe(
        reservations,
      );
    });
  });
});
