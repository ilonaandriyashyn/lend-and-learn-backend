import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from './users/user.entity';
import { ApiProperty } from '@nestjs/swagger';

class UserWithToken extends User {
  @ApiProperty()
  accessToken: string;
}

@Controller()
export class AppController {
  @Get()
  @UseGuards(AuthGuard('fit'))
  async homepage(@Req() req): Promise<UserWithToken> {
    return req.user;
  }
}
