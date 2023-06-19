import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UserNotFound } from '../exceptions/user-not-found';
import { ValidationGuard } from '../guard/validation.guard';
import { DeviceNotFound } from '../exceptions/device-not-found';
import { DeviceWithActiveReservations } from '../exceptions/device-with-active-reservations';
import { CustomCodes } from '../consts/codes';
import { DevicesLimitDto } from './dto/devices-limit-dto';
import { UpdateDeviceDto } from './dto/update-device-dto';
import DevicesWithCount from './helpers/devices-with-count';

@Controller('devices')
export class DevicesController {
  constructor(private readonly deviceService: DevicesService) {}

  @Get()
  @UseGuards(ValidationGuard)
  getDevicesWithPagination(@Query() query: DevicesLimitDto): Promise<DevicesWithCount> {
    return this.deviceService.findAll(query.limit, query.offset);
  }

  @Get(':id')
  @UseGuards(ValidationGuard)
  async getDevice(@Param('id') id: number) {
    try {
      return await this.deviceService.findDeviceWithOwnerAndReservations(id);
    } catch (e) {
      if (e instanceof DeviceNotFound) {
        throw new NotFoundException('Device not found');
      }
      throw e;
    }
  }

  @Put(':id')
  @UseGuards(ValidationGuard)
  async updateDevice(@Param('id') id: number, @Req() req, @Body() data: UpdateDeviceDto) {
    try {
      await this.deviceService.updateDevice(id, req.userName, data.name, data.description);
    } catch (e) {
      if (e instanceof DeviceNotFound) {
        throw new NotFoundException('Device not found');
      }
      throw e;
    }
  }

  @Post()
  @UseGuards(ValidationGuard)
  async createDevice(@Body() device: CreateDeviceDto) {
    try {
      await this.deviceService.addNewDevice(device.name, device.description, device.username);
    } catch (e) {
      if (e instanceof UserNotFound) {
        throw new BadRequestException('User not found');
      }
      throw e;
    }
  }

  @Delete(':id')
  @UseGuards(ValidationGuard)
  async delete(@Param('id') id: number, @Req() req) {
    try {
      await this.deviceService.deleteDevice(id, req.userName);
    } catch (e) {
      if (e instanceof DeviceNotFound) {
        throw new BadRequestException('Device not found');
      }
      if (e instanceof DeviceWithActiveReservations) {
        throw new BadRequestException({
          code: CustomCodes.DeviceWithActiveReservations,
          message: 'Device has some active reservations',
        });
      }
      throw e;
    }
  }
}
