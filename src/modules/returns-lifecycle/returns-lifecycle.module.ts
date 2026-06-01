import { Module } from '@nestjs/common';
import { ReturnsModule } from '../returns/modules/returns.module';
import { ReturnsLifecycleController } from './returns-lifecycle.controller';
import { ReturnsLifecycleService } from './returns-lifecycle.service';

@Module({
  imports: [ReturnsModule],
  controllers: [ReturnsLifecycleController],
  providers: [ReturnsLifecycleService],
  exports: [ReturnsLifecycleService],
})
export class ReturnsLifecycleModule {}