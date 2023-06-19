import DeviceWithBookedTodayParam from './device-with-booked-today-param.dto';
import { ApiProperty } from '@nestjs/swagger';

class DevicesWithCount {
  @ApiProperty()
  total: number;

  @ApiProperty({ type: [DeviceWithBookedTodayParam] })
  results: DeviceWithBookedTodayParam[];
}

export default DevicesWithCount;
