import { Module } from '@nestjs/common';
import { ShippingAddressesService } from './shipping-addresses.service';
import { ShippingAddressesController } from './shipping-addresses.controller';

@Module({
  providers: [ShippingAddressesService],
  controllers: [ShippingAddressesController],
  exports: [ShippingAddressesService],
})
export class ShippingAddressesModule {}
