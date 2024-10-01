import { Module } from '@nestjs/common';
import { AdminAlertsGateway } from './admin-alerts.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AdminAlertsGateway],
  exports: [AdminAlertsGateway],
})
export class AdminAlertsModule {}
