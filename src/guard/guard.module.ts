import { HttpModule, Module } from '@nestjs/common';
import { ValidationGuard } from './validation.guard';

@Module({
  imports: [HttpModule],
  controllers: [],
  providers: [ValidationGuard],
  exports: [],
})
export class GuardModule {}
