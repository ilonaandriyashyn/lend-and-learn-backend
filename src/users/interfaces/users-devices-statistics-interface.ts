import { ApiProperty } from '@nestjs/swagger';

export class UsersDevicesStatisticsInterface {
  @ApiProperty()
  count: number;

  @ApiProperty()
  lent: number;

  @ApiProperty()
  available: number;
}
