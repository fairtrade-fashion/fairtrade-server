import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Order, Prisma, OrderStatus } from '@prisma/client';
import { EmailService } from 'src/email/email.service';
import { AdminAlertsGateway } from 'src/admin-alerts/admin-alerts.gateway';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private adminAlertsGateway: AdminAlertsGateway,
  ) {}

  async order(
    orderWhereUniqueInput: Prisma.OrderWhereUniqueInput,
  ): Promise<Order | null> {
    return this.prisma.order.findUnique({
      where: orderWhereUniqueInput,
      include: {
        items: true,
        shippingAddress: true,
      },
    });
  }

  async orders(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.OrderWhereUniqueInput;
    where?: Prisma.OrderWhereInput;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
  }): Promise<Order[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.order.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        items: true,
        shippingAddress: true,
      },
    });
  }

  async createOrder(orderData: {
    userId: string;
    items: { productId: string; quantity: number; price: number }[];
    total: number;
    shipping_address_id: string;
    reference: string;
  }): Promise<Order> {
    const { userId, items, total, shipping_address_id, reference } = orderData;

    const orderCreateInput: Prisma.OrderCreateInput = {
      total,
      status: OrderStatus.PAID,
      user: { connect: { id: userId } },
      shippingAddress: { connect: { id: shipping_address_id } },
      paymentReference: reference,
      items: {
        create: items.map((item) => ({
          quantity: item.quantity,
          price: item.price,
          product: { connect: { id: item.productId } },
        })),
      },
    };

    const order = await this.prisma.order.create({
      data: orderCreateInput,
      include: {
        items: { include: { product: true } },
        user: true,
        shippingAddress: true,
      },
    });
    console.log(order);

    await this.emailService.sendOrderConfirmation(order.user.email, order);
    this.adminAlertsGateway.sendNewOrderAlert(order);

    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return order;
  }

  async getOrderById(
    orderId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<Order> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this order',
      );
    }
    return order;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrder(params: {
    where: Prisma.OrderWhereUniqueInput;
    data: Prisma.OrderUpdateInput;
  }): Promise<Order> {
    const { data, where } = params;
    const updatedOrder = await this.prisma.order.update({
      data,
      where,
      include: {
        items: true,
        shippingAddress: true,
        user: true,
      },
    });

    // Send order status update email
    await this.emailService.sendOrderStatusUpdate(
      updatedOrder.user.email,
      updatedOrder,
    );

    return updatedOrder;
  }
}
