import { Controller, Post, Body, BadRequestException, UseGuards, Param, Put, Req, Get } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { UserNotFound } from '../exceptions/user-not-found';
import { ValidationGuard } from '../guard/validation.guard';
import { CreateReservationDto } from './dto/create-reservation-dto';
import { DeviceNotFound } from '../exceptions/device-not-found';
import { ReservationCollision } from '../exceptions/reservation-collision';
import { ReservationNotFound } from '../exceptions/reservation-not-found';
import { ReservationWrongStatus } from '../exceptions/reservation-wrong-status';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @UseGuards(ValidationGuard)
  async createReservation(@Body() reservation: CreateReservationDto, @Req() req) {
    try {
      await this.reservationsService.addNewReservation(
        reservation.dateStart,
        reservation.dateEnd,
        reservation.deviceId,
        req.userName,
      );
    } catch (e) {
      if (e instanceof ReservationCollision) {
        throw new BadRequestException('Reservation date collision');
      }
      if (e instanceof UserNotFound) {
        throw new BadRequestException('User not found');
      }
      if (e instanceof DeviceNotFound) {
        throw new BadRequestException('Device not found');
      }
      throw e;
    }
  }

  @Put(':id/status-finish')
  @UseGuards(ValidationGuard)
  async finishReservation(@Param('id') id: number, @Req() req) {
    try {
      await this.reservationsService.finishReservation(id, req.userName);
    } catch (e) {
      if (e instanceof ReservationNotFound) {
        throw new BadRequestException('Reservation not found');
      }
      if (e instanceof ReservationWrongStatus) {
        throw new BadRequestException('Cannot change status to finished');
      }
      throw e;
    }
  }

  @Put(':id/status-approve')
  @UseGuards(ValidationGuard)
  async approveReservation(@Param('id') id: number, @Req() req) {
    try {
      await this.reservationsService.approveReservation(id, req.userName);
    } catch (e) {
      if (e instanceof ReservationNotFound) {
        throw new BadRequestException('Reservation not found');
      }
      if (e instanceof ReservationWrongStatus) {
        throw new BadRequestException('Cannot change status to finished');
      }
      throw e;
    }
  }

  @Put(':id/status-cancel')
  @UseGuards(ValidationGuard)
  async cancelReservation(@Param('id') id: number, @Req() req) {
    try {
      await this.reservationsService.cancelReservation(id, req.userName);
    } catch (e) {
      if (e instanceof ReservationNotFound) {
        throw new BadRequestException('Reservation not found');
      }
      if (e instanceof ReservationWrongStatus) {
        throw new BadRequestException('Cannot change status to finished');
      }
      throw e;
    }
  }

  @Get(':username/created')
  @UseGuards(ValidationGuard)
  async getUsersIncomeCreatedReservations(@Param('username') username: string, @Req() req) {
    return this.reservationsService.findUsersIncomeCreatedReservations(username, req.userName);
  }

  @Get(':username/in-progress')
  @UseGuards(ValidationGuard)
  async getUsersIncomeInProgressReservations(@Param('username') username: string, @Req() req) {
    return this.reservationsService.findUsersIncomeInProgressReservations(username, req.userName);
  }
}
