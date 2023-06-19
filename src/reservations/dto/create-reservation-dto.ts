import { IsDate, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty()
  @IsDate()
  dateStart: Date;

  @ApiProperty()
  @IsDate()
  dateEnd: Date;

  @ApiProperty()
  @IsNumber()
  deviceId: number;
}
