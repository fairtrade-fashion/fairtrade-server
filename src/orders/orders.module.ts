import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { EmailModule } from 'src/email/email.module';
import { AdminAlertsModule } from 'src/admin-alerts/admin-alerts.module';

@Module({
  providers: [OrdersService],
  imports: [EmailModule, AdminAlertsModule],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
