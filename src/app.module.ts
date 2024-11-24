import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { CartsModule } from './carts/carts.module';
import { PaymentsModule } from './payments/payments.module';
// import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { WishlistsModule } from './wishlists/wishlists.module';
import { ReviewsModule } from './reviews/reviews.module';
import { EmailModule } from './email/email.module';
import { AdminAlertsGateway } from './admin-alerts/admin-alerts.gateway';
import { AdminAlertsModule } from './admin-alerts/admin-alerts.module';
import { JwtService } from '@nestjs/jwt';
import { ShippingAddressesModule } from './shipping-addresses/shipping-addresses.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    CategoriesModule,
    CartsModule,
    PaymentsModule,
    WishlistsModule,
    ReviewsModule,
    EmailModule,
    AdminAlertsModule,
    ShippingAddressesModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [AdminAlertsGateway, JwtService],
})
// export class AppModule implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer.apply(LoggerMiddleware).forRoutes('*');
//   }
// }
export class AppModule {}
