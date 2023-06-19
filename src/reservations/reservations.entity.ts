import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Device } from '../devices/device.entity';
import { ReservationsStatus } from './reservations-status';

@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  dateStart: Date;

  @Column({ type: 'date' })
  dateEnd: Date;

  @Column({
    type: 'enum',
    enum: ReservationsStatus,
    default: ReservationsStatus.Created,
  })
  status: ReservationsStatus;

  // user that creates reservation
  @ManyToOne(() => User, (user) => user.reservations)
  user: User;

  @ManyToOne(() => Device, (device) => device.reservations, { onDelete: 'CASCADE' })
  device: Device;
}
