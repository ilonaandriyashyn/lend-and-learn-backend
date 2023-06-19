import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './reservations.entity';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { UsersModule } from '../users/users.module';
import { GuardModule } from '../guard/guard.module';
import { DevicesModule } from '../devices/devices.module';
import { ReservationsRepository } from './reservations.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, ReservationsRepository]),
    UsersModule,
    DevicesModule,
    GuardModule,
    HttpModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
