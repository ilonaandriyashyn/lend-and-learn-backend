import { Device } from '../device.entity';
import { ApiProperty } from '@nestjs/swagger';

class DeviceWithBookedTodayParam extends Device {
  @ApiProperty()
  isBookedToday: boolean;
}

export default DeviceWithBookedTodayParam;
