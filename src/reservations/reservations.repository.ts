import { Reservation } from './reservations.entity';
import { EntityRepository, Repository } from 'typeorm';
import { ReservationsStatus } from './reservations-status';

@EntityRepository(Reservation)
export class ReservationsRepository extends Repository<Reservation> {
  countCollisions(dateStart: Date, dateEnd: Date, deviceId: number): Promise<number> {
    return this.createQueryBuilder()
      .where(
        '((:start BETWEEN "dateStart" AND "dateEnd" OR :end BETWEEN "dateStart" AND "dateEnd") OR (:start <= "dateStart" AND :end >= "dateEnd"))',
      )
      .andWhere('"status" IN (:optionCreated, :optionInProgress)')
      .andWhere(':id = "deviceId"')
      .setParameters({
        start: dateStart,
        end: dateEnd,
        id: deviceId,
        optionCreated: ReservationsStatus.Created,
        optionInProgress: ReservationsStatus.InProgress,
      })
      .getCount();
  }

  findIncomeCreatedReservations(username: string): Promise<Reservation[]> {
    return this.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.device', 'device')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoin('device.owner', 'owner')
      .where('owner.username=:username', { username })
      .andWhere('reservation.status=:status', { status: ReservationsStatus.Created })
      .getMany();
  }

  findIncomeInProgressReservations(username: string): Promise<Reservation[]> {
    return this.createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.device', 'device')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoin('device.owner', 'owner')
      .where('owner.username=:username', { username })
      .andWhere('reservation.status=:status', { status: ReservationsStatus.InProgress })
      .getMany();
  }
}
