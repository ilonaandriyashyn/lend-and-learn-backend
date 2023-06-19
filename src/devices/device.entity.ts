import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Reservation } from '../reservations/reservations.entity';

@Entity()
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 2000 })
  description: string;

  @ManyToOne(() => User, (user) => user.ownedDevices)
  owner: User;

  @OneToMany(() => Reservation, (reservation) => reservation.device)
  reservations: Reservation[];
}
