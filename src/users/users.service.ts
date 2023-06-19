import { HttpService, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservation } from '../reservations/reservations.entity';
import { UsersRepository } from './users.repository';
import { UsersDevicesStatisticsInterface } from './interfaces/users-devices-statistics-interface';
import DevicesWithCount from '../devices/helpers/devices-with-count';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private http: HttpService,
  ) {}

  async findOne(username: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ username: username });
  }

  async updateUser(username: string, authUsername: string, accessToken: string): Promise<User> {
    if (username !== authUsername) {
      throw new UnauthorizedException();
    }
    try {
      const { data } = await this.http
        .get(`https://kosapi.fit.cvut.cz/usermap/v1/people/${username}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .toPromise();
      const user = await this.usersRepository.findOne({ username: username });
      if (user === undefined) {
        return null;
      }
      user.firstName = data.firstName;
      user.lastName = data.lastName;
      user.username = data.username;
      user.email = data.preferredEmail;
      return this.usersRepository.save(user);
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  async addNewUser(username: string, firstName: string, lastName: string, email: string): Promise<User> {
    const user = this.usersRepository.create({
      username,
      firstName: firstName,
      lastName: lastName,
      email: email,
    });
    return this.usersRepository.save(user);
  }

  async findUsersDevices(
    username: string,
    authUsername: string,
    limit: number,
    offset: number,
  ): Promise<DevicesWithCount> {
    if (username !== authUsername) {
      throw new UnauthorizedException();
    }
    const user = await this.usersRepository.findUserWithOwnedDevicesAndTodayReservation(username);
    if (user === undefined) {
      return {
        total: 0,
        results: [],
      };
    }
    const total = user.ownedDevices.length;
    const d = user.ownedDevices.slice(offset, offset + limit);
    return {
      total,
      results: d.map((result) => ({ ...result, isBookedToday: !!result?.isBookedToday })),
    };
  }

  async findUsersReservationsCreated(username: string, authUsername: string): Promise<Reservation[]> {
    if (username !== authUsername) {
      throw new UnauthorizedException();
    }
    const user = await this.usersRepository.findOne({ username: username });
    if (user === undefined) {
      return [];
    }
    const u = await this.usersRepository.findUserWithCreatedReservations(username);
    return u.reservations;
  }

  async findUsersReservationsInProgress(username: string, authUsername: string): Promise<Reservation[]> {
    if (username !== authUsername) {
      throw new UnauthorizedException();
    }
    const user = await this.usersRepository.findOne({ username: username });
    if (user === undefined) {
      return [];
    }
    const u = await this.usersRepository.findUserWithInProgressReservations(username);
    return u.reservations;
  }

  async findUsersDevicesStatistics(username: string, authUsername: string): Promise<UsersDevicesStatisticsInterface> {
    if (username !== authUsername) {
      throw new UnauthorizedException();
    }
    const user = await this.usersRepository.findUserWithOwnedDevicesAndActiveReservations(username);
    if (user === undefined) {
      return {
        count: 0,
        lent: 0,
        available: 0,
      };
    }
    const count = user.ownedDevices?.length;
    const lent = user.ownedDevices?.filter((device) => device?.reservations?.length > 0).length;
    return {
      count,
      lent,
      available: count - lent,
    };
  }
}
