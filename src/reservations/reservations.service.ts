import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { UserNotFound } from '../exceptions/user-not-found';
import { Reservation } from './reservations.entity';
import { DevicesService } from '../devices/devices.service';
import { DeviceNotFound } from '../exceptions/device-not-found';
import { ReservationsRepository } from './reservations.repository';
import { ReservationCollision } from '../exceptions/reservation-collision';
import { ReservationsStatus } from './reservations-status';
import { ReservationNotFound } from '../exceptions/reservation-not-found';
import { ReservationWrongStatus } from '../exceptions/reservation-wrong-status';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(ReservationsRepository)
    private reservationsRepository: ReservationsRepository,
    private usersService: UsersService,
    private devicesService: DevicesService,
  ) {}

  async addNewReservation(dateStart: Date, dateEnd: Date, deviceId: number, username: string): Promise<Reservation> {
    const countCollisions = await this.reservationsRepository.countCollisions(dateStart, dateEnd, deviceId);
    if (countCollisions !== 0) {
      throw new ReservationCollision();
    }
    const user = await this.usersService.findOne(username);
    if (!user) {
      throw new UserNotFound();
    }
    const device = await this.devicesService.findOne(deviceId);
    if (!device) {
      throw new DeviceNotFound();
    }
    const reservation = this.reservationsRepository.create({
      dateStart,
      dateEnd,
      device,
      user,
    });
    return this.reservationsRepository.save(reservation);
  }

  async finishReservation(id: number, username: string): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne(id, { relations: ['device', 'device.owner'] });
    if (!reservation) {
      throw new ReservationNotFound();
    }
    if (reservation.device.owner.username !== username) {
      throw new UnauthorizedException();
    }
    if (reservation.status !== ReservationsStatus.InProgress) {
      throw new ReservationWrongStatus();
    }
    reservation.status = ReservationsStatus.Finished;
    return this.reservationsRepository.save(reservation);
  }

  async approveReservation(id: number, username: string): Promise<Reservation> {
    const reservation = await this.reservationsRepository.findOne(id, { relations: ['device', 'device.owner'] });
    if (!reservation) {
      throw new ReservationNotFound();
    }
    if (reservation.device.owner.username !== username) {
      throw new UnauthorizedException();
    }
    if (reservation.status !== ReservationsStatus.Created) {
      throw new ReservationWrongStatus();
    }
    reservation.status = ReservationsStatus.InProgress;
    return this.reservationsRepository.save(reservation);
  }

  // can be cancelled by owner of device or creator of reservation
  async cancelReservation(id: number, username: string) {
    const reservation = await this.reservationsRepository.findOne(id, {
      relations: ['user', 'device', 'device.owner'],
    });
    if (!reservation) {
      throw new ReservationNotFound();
    }
    if (reservation.device.owner.username !== username && reservation.user.username !== username) {
      throw new UnauthorizedException();
    }
    if (reservation.status !== ReservationsStatus.Created) {
      throw new ReservationWrongStatus();
    }
    reservation.status = ReservationsStatus.Cancelled;
    return this.reservationsRepository.save(reservation);
  }

  async findUsersIncomeCreatedReservations(username: string, authUsername: string): Promise<Reservation[]> {
    if (username !== authUsername) {
      throw new UnauthorizedException();
    }
    return this.reservationsRepository.findIncomeCreatedReservations(username);
  }

  async findUsersIncomeInProgressReservations(username: string, authUsername: string): Promise<Reservation[]> {
    if (username !== authUsername) {
      throw new UnauthorizedException();
    }
    return this.reservationsRepository.findIncomeInProgressReservations(username);
  }
}
