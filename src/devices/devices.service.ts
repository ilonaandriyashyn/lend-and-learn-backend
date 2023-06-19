import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult } from 'typeorm';
import { Device } from './device.entity';
import { UsersService } from '../users/users.service';
import { UserNotFound } from '../exceptions/user-not-found';
import { DeviceNotFound } from '../exceptions/device-not-found';
import { DevicesRepository } from './devices.repository';
import { DeviceWithActiveReservations } from '../exceptions/device-with-active-reservations';
import DevicesWithCount from './helpers/devices-with-count';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(DevicesRepository)
    private devicesRepository: DevicesRepository,
    private usersService: UsersService,
  ) {}

  async findOne(id: number): Promise<Device | undefined> {
    return this.devicesRepository.findOne({ id: id });
  }

  async findDeviceWithOwnerAndReservations(id: number): Promise<Device | undefined> {
    const result = await this.devicesRepository.findDeviceWithActiveReservationsAndOwner(id);
    if (result === undefined) {
      throw new DeviceNotFound();
    }
    return result;
  }

  async updateDevice(id: number, username: string, name: string, description: string): Promise<Device> {
    const device = await this.devicesRepository.findOne(id, { relations: ['owner'] });
    if (device === undefined) {
      throw new DeviceNotFound();
    }
    if (device.owner.username !== username) {
      throw new UnauthorizedException();
    }
    device.name = name;
    device.description = description;
    return this.devicesRepository.save(device);
  }

  async findAll(limit: number, offset: number): Promise<DevicesWithCount> {
    const [results, total] = await this.devicesRepository.findDevicesWithActiveReservations(limit, offset);
    return {
      total,
      results: results.map((result) => ({ ...result, isBookedToday: !!result?.isBookedToday })),
    };
  }

  async addNewDevice(name: string, description: string, username: string): Promise<Device> {
    const owner = await this.usersService.findOne(username);
    if (!owner) {
      throw new UserNotFound();
    }
    const device = this.devicesRepository.create({
      name,
      description,
      owner,
    });
    return this.devicesRepository.save(device);
  }

  async deleteDevice(id: number, username: string): Promise<DeleteResult> {
    const device = await this.devicesRepository.findOne(id, { relations: ['owner'] });
    if (!device) {
      throw new DeviceNotFound();
    }
    if (device.owner.username !== username) {
      throw new UnauthorizedException();
    }
    const r = await this.devicesRepository.findDeviceWithActiveReservationsAndOwner(id);
    if (r.reservations?.length !== 0) {
      throw new DeviceWithActiveReservations();
    }
    return this.devicesRepository.delete(id);
  }
}
