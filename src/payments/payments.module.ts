import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CartsService } from 'src/carts/carts.service';
import { OrdersService } from 'src/orders/orders.service';
import { EmailModule } from 'src/email/email.module';
import { AdminAlertsModule } from 'src/admin-alerts/admin-alerts.module';
import { ShippingAddressesModule } from 'src/shipping-addresses/shipping-addresses.module';

@Module({
  imports: [EmailModule, AdminAlertsModule, ShippingAddressesModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, CartsService, OrdersService],
})
export class PaymentsModule {}
