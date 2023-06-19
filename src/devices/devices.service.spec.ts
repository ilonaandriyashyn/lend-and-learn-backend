import { DevicesService } from './devices.service';
import { User } from '../users/user.entity';
import { Device } from './device.entity';
import { DevicesRepository } from './devices.repository';
import DeviceWithTodayReservation from './helpers/device-with-today-reservation';
import { ReservationsStatus } from '../reservations/reservations-status';
import { DeepPartial, DeleteResult } from 'typeorm';
import { UserNotFound } from '../exceptions/user-not-found';
import { DeviceNotFound } from '../exceptions/device-not-found';
import { UnauthorizedException } from '@nestjs/common';
import { DeviceWithActiveReservations } from '../exceptions/device-with-active-reservations';

class DevicesRepositoryMock implements Partial<DevicesRepository> {
  async findOne(): Promise<Device> {
    return new Device();
  }
  async findDevicesWithActiveReservations(): Promise<[DeviceWithTodayReservation[], number]> {
    return [[], 0];
  }
  create(): Device;
  create(entityLikeArray: DeepPartial<Device>[]): Device[];
  create(entityLike: DeepPartial<Device>): Device;
  create(): Device | Device[] {
    return new Device();
  }
  async save<T extends DeepPartial<Device>>(entity: T): Promise<T> {
    return entity;
  }
  async delete(): Promise<DeleteResult> {
    return new DeleteResult();
  }
  async findDeviceWithActiveReservationsAndOwner(): Promise<Device> {
    return {
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
  }
}

describe('DevicesService', () => {
  let devicesService: DevicesService;
  const usersService = {
    findOne: async (): Promise<User> => new User(),
  };
  const repo = new DevicesRepositoryMock();

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    devicesService = new DevicesService(repo, usersService);
  });

  describe('findOne', () => {
    it('calls findOne', async () => {
      const findOneSpy = jest.spyOn(repo, 'findOne');
      await devicesService.findOne(1);
      expect(findOneSpy).toHaveBeenCalledWith({ id: 1 });
    });

    it('returns device', async () => {
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
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      expect(await devicesService.findOne(1)).toBe(device);
    });

    it('returns undefined', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(undefined);
      expect(await devicesService.findOne(1)).toBe(undefined);
    });
  });

  describe('updateDevice', () => {
    it('calls findOne', async () => {
      const device: Device = {
        id: 1,
        name: 'device',
        description: 'description',
        owner: {
          id: 100,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        reservations: [],
      };
      const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      await devicesService.updateDevice(1, 'doejohn', 'device', 'description');
      expect(findOneSpy).toHaveBeenCalledWith(1, { relations: ['owner'] });
    });

    it('throws DeviceNotFound', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(undefined);
      await expect(devicesService.updateDevice(1, 'doejohn', 'device', 'description')).rejects.toThrow(DeviceNotFound);
    });

    it('throws DeviceNotFound', async () => {
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
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      await expect(devicesService.updateDevice(1, 'doejohn', 'device', 'description')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('calls save', async () => {
      const device: Device = {
        id: 1,
        name: 'device',
        description: 'description',
        owner: {
          id: 100,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        reservations: [],
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      const saveSpy = jest.spyOn(repo, 'save');
      await devicesService.updateDevice(1, 'doejohn', 'new device', 'new description');
      await expect(saveSpy).toHaveBeenCalledWith({
        ...device,
        name: 'new device',
        description: 'new description',
      });
    });

    it('returns device', async () => {
      const device: Device = {
        id: 1,
        name: 'device',
        description: 'description',
        owner: {
          id: 100,
          username: 'doejohn',
          firstName: 'John',
          lastName: 'Doe',
          email: 'doejohn@test.com',
        } as User,
        reservations: [],
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      jest.spyOn(repo, 'save').mockResolvedValueOnce({
        ...device,
        name: 'new device',
        description: 'new description',
      });
      await expect(await devicesService.updateDevice(1, 'doejohn', 'new device', 'new description')).toEqual({
        ...device,
        name: 'new device',
        description: 'new description',
      });
    });
  });

  describe('findDeviceWithOwnerAndReservations', () => {
    it('calls findDeviceWithActiveReservationsAndOwner', async () => {
      const findDeviceWithActiveReservationsAndOwnerSpy = jest.spyOn(repo, 'findDeviceWithActiveReservationsAndOwner');
      await devicesService.findDeviceWithOwnerAndReservations(1);
      expect(findDeviceWithActiveReservationsAndOwnerSpy).toHaveBeenCalledWith(1);
    });

    it('throws DeviceNotFound', async () => {
      jest.spyOn(repo, 'findDeviceWithActiveReservationsAndOwner').mockResolvedValueOnce(undefined);
      await expect(devicesService.findDeviceWithOwnerAndReservations(1)).rejects.toThrow(DeviceNotFound);
    });

    it('returns device', async () => {
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
      jest.spyOn(repo, 'findDeviceWithActiveReservationsAndOwner').mockResolvedValueOnce(device);
      expect(await devicesService.findDeviceWithOwnerAndReservations(1)).toBe(device);
    });
  });

  describe('findAll', () => {
    it('calls findDevicesWithActiveReservations', async () => {
      const findDevicesWithActiveReservationsSpy = jest.spyOn(repo, 'findDevicesWithActiveReservations');
      await devicesService.findAll(10, 20);
      expect(findDevicesWithActiveReservationsSpy).toHaveBeenCalledWith(10, 20);
    });

    it('returns devices with isBookedToday true', async () => {
      const devices: DeviceWithTodayReservation[] = [
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
          reservations: [],
          isBookedToday: {
            id: 200,
            dateStart: new Date('2021-01-01'),
            dateEnd: new Date('2021-01-09'),
            status: ReservationsStatus.Created,
            user: null,
            device: null,
          },
        },
      ];
      jest.spyOn(repo, 'findDevicesWithActiveReservations').mockResolvedValueOnce([devices, 1]);
      expect(await devicesService.findAll(10, 0)).toEqual({
        total: 1,
        results: [
          {
            ...devices[0],
            isBookedToday: true,
          },
        ],
      });
    });

    it('returns devices with isBookedToday false', async () => {
      const devices: DeviceWithTodayReservation[] = [
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
          reservations: [],
          isBookedToday: null,
        },
      ];
      jest.spyOn(repo, 'findDevicesWithActiveReservations').mockResolvedValueOnce([devices, 1]);
      expect(await devicesService.findAll(10, 0)).toEqual({
        total: 1,
        results: [
          {
            ...devices[0],
            isBookedToday: false,
          },
        ],
      });
    });

    it('returns devices with isBookedToday false (undefined)', async () => {
      const devices: DeviceWithTodayReservation[] = [
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
          reservations: [],
          isBookedToday: undefined,
        },
      ];
      jest.spyOn(repo, 'findDevicesWithActiveReservations').mockResolvedValueOnce([devices, 1]);
      expect(await devicesService.findAll(10, 0)).toEqual({
        total: 1,
        results: [
          {
            ...devices[0],
            isBookedToday: false,
          },
        ],
      });
    });

    it('returns empty array', async () => {
      expect(await devicesService.findAll(10, 0)).toEqual({ total: 0, results: [] });
    });
  });

  describe('addNewDevice', () => {
    it('calls users service findOne', async () => {
      const findOneSpy = jest.spyOn(usersService, 'findOne');
      await devicesService.addNewDevice('device', 'good', 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith('dicapleo');
    });

    it('throws UserNotFound', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined);
      await expect(devicesService.addNewDevice('device', 'good', 'dicapleo')).rejects.toThrow(UserNotFound);
    });

    it('calls create', async () => {
      const owner: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(owner);
      const createSpy = jest.spyOn(repo, 'create');
      await devicesService.addNewDevice('device', 'good', 'dicapleo');
      expect(createSpy).toHaveBeenCalledWith({ name: 'device', description: 'good', owner });
    });

    it('calls save', async () => {
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
      jest.spyOn(repo, 'create').mockReturnValueOnce(device);
      const saveSpy = jest.spyOn(repo, 'save');
      await devicesService.addNewDevice('device', 'good', 'dicapleo');
      expect(saveSpy).toHaveBeenCalledWith(device);
    });

    it('returns created device', async () => {
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
      jest.spyOn(repo, 'save').mockResolvedValueOnce(device);
      expect(await devicesService.addNewDevice('device', 'good', 'dicapleo')).toBe(device);
    });
  });

  describe('deleteDevice', () => {
    it('calls findOne', async () => {
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
      const findOneSpy = jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      await devicesService.deleteDevice(1, 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith(1, { relations: ['owner'] });
    });

    it('throws DeviceNotFound', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(undefined);
      await expect(devicesService.deleteDevice(1, 'dicapleo')).rejects.toThrow(DeviceNotFound);
    });

    it('throws UnauthorizedException', async () => {
      const device: Device = {
        id: 1,
        name: 'device',
        description: 'description',
        owner: {
          id: 100,
          username: 'damomat',
          firstName: 'Matt',
          lastName: 'Damon',
          email: 'damomat@test.com',
        } as User,
        reservations: [],
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      await expect(devicesService.deleteDevice(1, 'dicapleo')).rejects.toThrow(UnauthorizedException);
    });

    it('calls findDeviceWithActiveReservationsAndOwner', async () => {
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
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      const findDeviceWithActiveReservationsAndOwnerSpy = jest.spyOn(repo, 'findDeviceWithActiveReservationsAndOwner');
      await devicesService.deleteDevice(1, 'dicapleo');
      expect(findDeviceWithActiveReservationsAndOwnerSpy).toHaveBeenCalledWith(1);
    });

    it('throws DeviceWithActiveReservations', async () => {
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
            user: null,
            device: null,
          },
          {
            id: 201,
            dateStart: new Date('2021-02-01'),
            dateEnd: new Date('2021-02-09'),
            status: ReservationsStatus.InProgress,
            user: null,
            device: null,
          },
        ],
      };
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      jest.spyOn(repo, 'findDeviceWithActiveReservationsAndOwner').mockResolvedValueOnce(device);
      await expect(devicesService.deleteDevice(1, 'dicapleo')).rejects.toThrow(DeviceWithActiveReservations);
    });

    it('calls delete', async () => {
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
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      const deleteSpy = jest.spyOn(repo, 'delete');
      await devicesService.deleteDevice(1, 'dicapleo');
      expect(deleteSpy).toHaveBeenCalledWith(1);
    });

    it('returns delete result', async () => {
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
      jest.spyOn(repo, 'findOne').mockResolvedValueOnce(device);
      expect(await devicesService.deleteDevice(1, 'dicapleo')).toEqual(new DeleteResult());
    });
  });
});
