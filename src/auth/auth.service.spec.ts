import { AuthService, KosApiUserData } from './auth.service';
import { User } from '../users/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  const usersService = {
    findOne: async (): Promise<User> => new User(),
    addNewUser: async (): Promise<User> => new User(),
  };

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    authService = new AuthService({}, usersService);
  });

  describe('createUser', () => {
    it('return null', async () => {
      expect(await authService.createUser('abc', null)).toBe(null);
    });

    it('calls user service findOne', async () => {
      const findOneSpy = jest.spyOn(usersService, 'findOne');
      await authService.createUser('abc', 'dicapleo');
      expect(findOneSpy).toHaveBeenCalledWith('dicapleo');
    });

    it('returns found user', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(user);
      expect(await authService.createUser('abc', 'dicapleo')).toBe(user);
    });

    it('calls getUserData', async () => {
      const kosUserData: KosApiUserData = {
        username: 'dicapleo',
        firstName: 'Leo',
        lastName: 'DiCaprio',
        preferredEmail: 'dicapleo@test.com',
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined);
      const getUserDataSpy = jest.spyOn(authService, 'getUserData').mockResolvedValueOnce(kosUserData);
      await authService.createUser('abc', 'dicapleo');
      expect(getUserDataSpy).toHaveBeenCalledWith('abc', 'dicapleo');
    });

    it('returns null - getUserData', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined);
      jest.spyOn(authService, 'getUserData').mockResolvedValueOnce(undefined);
      expect(await authService.createUser('abc', 'dicapleo')).toBe(null);
    });

    it('calls addNewUser', async () => {
      const kosUserData: KosApiUserData = {
        username: 'dicapleo',
        firstName: 'Leo',
        lastName: 'DiCaprio',
        preferredEmail: 'dicapleo@test.com',
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined);
      jest.spyOn(authService, 'getUserData').mockResolvedValueOnce(kosUserData);
      const addNewUserSpy = jest.spyOn(usersService, 'addNewUser');
      await authService.createUser('abc', 'dicapleo');
      expect(addNewUserSpy).toHaveBeenCalledWith(
        kosUserData.username,
        kosUserData.firstName,
        kosUserData.lastName,
        kosUserData.preferredEmail,
      );
    });

    it('returns user', async () => {
      const user: User = {
        id: 1,
        firstName: 'Leo',
        lastName: 'DiCaprio',
        email: 'dicapleo@test.com',
        username: 'dicapleo',
        ownedDevices: [],
        reservations: [],
      };
      const kosUserData: KosApiUserData = {
        username: 'dicapleo',
        firstName: 'Leo',
        lastName: 'DiCaprio',
        preferredEmail: 'dicapleo@test.com',
      };
      jest.spyOn(usersService, 'findOne').mockResolvedValueOnce(undefined);
      jest.spyOn(authService, 'getUserData').mockResolvedValueOnce(kosUserData);
      jest.spyOn(usersService, 'addNewUser').mockResolvedValueOnce(user);
      expect(await authService.createUser('abc', 'dicapleo')).toBe(user);
    });
  });
});
