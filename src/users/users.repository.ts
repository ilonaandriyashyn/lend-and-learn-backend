import { EntityRepository, Repository } from 'typeorm';
import { ReservationsStatus } from '../reservations/reservations-status';
import { User } from './user.entity';
import UserDevicesWithTodayReservation from './helpers/user-devices-with-today-reservation';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  findUserWithCreatedReservations(username: string): Promise<User> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.reservations', 'reservation', 'reservation.status=:status', {
        status: ReservationsStatus.Created,
      })
      .leftJoinAndSelect('reservation.device', 'device')
      .leftJoinAndSelect('device.owner', 'owner')
      .where('user.username=:username', { username })
      .getOne();
  }

  findUserWithInProgressReservations(username: string): Promise<User> {
    return this.createQueryBuilder('user')
      .leftJoinAndSelect('user.reservations', 'reservation', 'reservation.status=:status', {
        status: ReservationsStatus.InProgress,
      })
      .leftJoinAndSelect('reservation.device', 'device')
      .leftJoinAndSelect('device.owner', 'owner')
      .where('user.username=:username', { username })
      .getOne();
  }

  // isBookedToday is added in query builder manually
  findUserWithOwnedDevicesAndTodayReservation(username: string): Promise<UserDevicesWithTodayReservation> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this.createQueryBuilder('user')
      .where('user.username=:username', { username })
      .leftJoinAndSelect('user.ownedDevices', 'device')
      .leftJoinAndSelect('device.owner', 'owner')
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
      .getOne();
  }

  findUserWithOwnedDevicesAndActiveReservations(username: string): Promise<User> {
    return this.createQueryBuilder('user')
      .where('user.username=:username', { username })
      .leftJoinAndSelect('user.ownedDevices', 'device')
      .leftJoinAndSelect(
        'device.reservations',
        'reservation',
        'reservation.status IN (:optionCreated, :optionInProgress) AND NOW()::date BETWEEN reservation.dateStart AND reservation.dateEnd AND reservation.status IN (:optionCreated, :optionInProgress)',
      )
      .setParameters({
        optionCreated: ReservationsStatus.Created,
        optionInProgress: ReservationsStatus.InProgress,
      })
      .getOne();
  }
}
