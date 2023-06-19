import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { UsersModule } from '../users/users.module';
import { GuardModule } from '../guard/guard.module';
import { DevicesRepository } from './devices.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Device, DevicesRepository]), UsersModule, GuardModule, HttpModule],
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
