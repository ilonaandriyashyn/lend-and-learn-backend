import { Controller, Get, UseGuards, Param, Req, Put, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { ValidationGuard } from '../guard/validation.guard';
import { DevicesLimitDto } from '../devices/dto/devices-limit-dto';
import DevicesWithCount from '../devices/helpers/devices-with-count';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  @UseGuards(ValidationGuard)
  async getUser(@Param('username') username: string) {
    return this.usersService.findOne(username);
  }

  @Put(':username/update')
  @UseGuards(ValidationGuard)
  async updateUserData(@Param('username') username: string, @Req() req) {
    return this.usersService.updateUser(username, req.userName, req.accessToken);
  }

  @Get(':username/devices')
  @UseGuards(ValidationGuard)
  async getUsersDevices(
    @Param('username') username: string,
    @Req() req,
    @Query() query: DevicesLimitDto,
  ): Promise<DevicesWithCount> {
    return this.usersService.findUsersDevices(username, req.userName, query.limit, query.offset);
  }

  @Get(':username/reservations/created')
  @UseGuards(ValidationGuard)
  async getUsersReservationsCreated(@Param('username') username: string, @Req() req) {
    return this.usersService.findUsersReservationsCreated(username, req.userName);
  }

  @Get(':username/reservations/in-progress')
  @UseGuards(ValidationGuard)
  async getUsersReservationsInProgress(@Param('username') username: string, @Req() req) {
    return this.usersService.findUsersReservationsInProgress(username, req.userName);
  }

  @Get(':username/devices/statistics')
  @UseGuards(ValidationGuard)
  async getUsersDevicesStatistics(@Param('username') username: string, @Req() req) {
    return this.usersService.findUsersDevicesStatistics(username, req.userName);
  }
}
