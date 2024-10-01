import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Product } from '@prisma/client';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async sendOrderConfirmation(email: string, order: any) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Order Confirmation',
      template: './order-confirmation',
      context: {
        name: order.user.name,
        orderId: order.id,
        orderItems: order.items,
        total: order.total,
      },
    });
  }

  async sendOrderStatusUpdate(email: string, order: any) {
    await this.mailerService.sendMail({
      to: email,
      subject: `Order Status Update: ${order.status}`,
      template: './order-status-update',
      context: {
        name: order.user.name,
        orderId: order.id,
        status: order.status,
      },
    });
  }

  async sendLowStockAlert(email: string, product: Product) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Low Stock Alert',
      template: './low-stock-alert',
      context: {
        productName: product.name,
        productId: product.id,
        currentStock: product.stock,
      },
    });
  }

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${token}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      template: './password-reset',
      context: {
        resetUrl,
      },
    });
  }
}
