import { Device } from '../device.entity';
import { Reservation } from '../../reservations/reservations.entity';

type DeviceWithTodayReservation = Device & { isBookedToday: Reservation | null };

export default DeviceWithTodayReservation;
