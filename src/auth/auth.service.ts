import { HttpService, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

export interface KosApiUserData {
  username: string;
  firstName: string;
  lastName: string;
  preferredEmail: string;
}

@Injectable()
export class AuthService {
  constructor(private http: HttpService, private readonly usersService: UsersService) {}

  async getUserData(accessToken: string, username: string): Promise<KosApiUserData> {
    const { data } = await this.http
      .get(`https://kosapi.fit.cvut.cz/usermap/v1/people/${username}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .toPromise();
    return data as KosApiUserData;
  }

  async createUser(accessToken: string, username: string): Promise<User> {
    if (username) {
      const user = await this.usersService.findOne(username);
      if (user === undefined) {
        const data = await this.getUserData(accessToken, username);
        if (!data) {
          return null;
        }
        return await this.usersService.addNewUser(data.username, data.firstName, data.lastName, data.preferredEmail);
      }
      return user;
    }
    return null;
  }
}
