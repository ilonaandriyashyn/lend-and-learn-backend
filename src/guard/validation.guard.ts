import { Injectable, CanActivate, ExecutionContext, HttpService, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ValidationGuard implements CanActivate {
  constructor(private readonly http: HttpService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.headers['x-api-key'];
    if (!accessToken) {
      throw new UnauthorizedException();
    }
    try {
      const { data } = await this.http
        .post(`https://auth.fit.cvut.cz/oauth/oauth/check_token?token=${accessToken}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .toPromise();
      request.userName = data.user_name;
      request.accessToken = accessToken;
      return true;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
