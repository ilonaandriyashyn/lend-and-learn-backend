import { EntityRepository, Repository } from 'typeorm';
import { Device } from './device.entity';
import { ReservationsStatus } from '../reservations/reservations-status';
import DeviceWithTodayReservation from './helpers/device-with-today-reservation';

@EntityRepository(Device)
export class DevicesRepository extends Repository<Device> {
  // isBookedToday is added in query builder manually
  findDevicesWithActiveReservations(limit: number, offset: number): Promise<[DeviceWithTodayReservation[], number]> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this.createQueryBuilder('device')
      .leftJoinAndSelect('device.owner', 'user')
      .leftJoinAndSelect(
        'device.reservations',
        'reservation',
        'reservation.status IN (:optionCreated, :optionInProgress)',
      )
      .leftJoinAndMapOne(
        'device.isBookedToday',
        'device.reservations',
        'r',
        'NOW()::date BETWEEN r.dateStart AND r.dateEnd AND r.status IN (:optionCreated, :optionInProgress)',
      )
      .setParameters({
        optionCreated: ReservationsStatus.Created,
        optionInProgress: ReservationsStatus.InProgress,
      })
      .skip(offset)
      .take(limit)
      .getManyAndCount();
  }
  findDeviceWithActiveReservationsAndOwner(id: number): Promise<Device> {
    return this.createQueryBuilder('device')
      .leftJoinAndSelect(
        'device.reservations',
        'reservation',
        'reservation.status IN (:optionCreated, :optionInProgress)',
      )
      .leftJoinAndSelect('device.owner', 'owner')
      .where('device.id=:id', { id })
      .setParameters({
        optionCreated: ReservationsStatus.Created,
        optionInProgress: ReservationsStatus.InProgress,
      })
      .getOne();
  }
}
