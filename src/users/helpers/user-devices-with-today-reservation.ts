import { User } from '../user.entity';
import DeviceWithTodayReservation from '../../devices/helpers/device-with-today-reservation';

type UserDevicesWithTodayReservation = Omit<User, 'ownedDevices'> & { ownedDevices: DeviceWithTodayReservation[] };

export default UserDevicesWithTodayReservation;
