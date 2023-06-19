import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DevicesModule } from './devices/devices.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { GuardModule } from './guard/guard.module';
import { ReservationsModule } from './reservations/reservations.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    DevicesModule,
    GuardModule,
    ReservationsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'database',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'lend_and_learn',
      synchronize: true, // not synchronize in production, could loose data
      autoLoadEntities: true,
    }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
