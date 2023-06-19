import { HttpService, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ENV } from '../env';
import { stringify } from 'querystring';
import { AuthService } from './auth.service';

@Injectable()
export class FitStrategy extends PassportStrategy(Strategy, 'fit') {
  constructor(private http: HttpService, private authService: AuthService) {
    super({
      authorizationURL: `https://auth.fit.cvut.cz/oauth/oauth/authorize?${stringify({
        client_id: ENV.CLIENT_ID,
        redirect_uri: ENV.REDIRECT_URL,
        response_type: 'code',
      })}`,
      clientID: ENV.CLIENT_ID,
      clientSecret: ENV.CLIENT_SECRET,
      callbackURL: ENV.REDIRECT_URL,
      tokenURL: 'https://auth.fit.cvut.cz/oauth/oauth/token',
      scope: ENV.SCOPE,
    });
  }

  async validate(accessToken: string): Promise<any> {
    const { data } = await this.http
      .post(`https://auth.fit.cvut.cz/oauth/oauth/check_token?token=${accessToken}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .toPromise();
    const user = await this.authService.createUser(accessToken, data.user_name);
    if (user) {
      return {
        user,
        accessToken,
      };
    }
    return null;
  }
}
