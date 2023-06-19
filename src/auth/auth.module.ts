import { HttpModule, Module } from '@nestjs/common';
import { FitStrategy } from './fit.strategy';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [HttpModule, UsersModule],
  controllers: [],
  providers: [FitStrategy, AuthService],
  exports: [],
})
export class AuthModule {}
