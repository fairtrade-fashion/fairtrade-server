import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CartsService } from 'src/carts/carts.service';
import { OrdersService } from 'src/orders/orders.service';
import { PrismaService } from 'src/prisma/prisma.service';

import {
  PaystackCreateTransactionDto,
  PaystackCreateTransactionResponseDto,
  PaystackVerifyTransactionResponseDto,
} from './types';
import axios from 'axios';
import {
  PAYSTACK_SUCCESS_STATUS,
  PAYSTACK_TRANSACTION_INI_URL,
  PAYSTACK_TRANSACTION_VERIFY_BASE_URL,
} from 'src/config/constants';
import { ShippingAddressesService } from 'src/shipping-addresses/shipping-addresses.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private cartsService: CartsService,
    private ordersService: OrdersService,
    private shippingAddresssService: ShippingAddressesService,
  ) {}

  private getPaystackSecretKey(): string {
    const key = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!key) {
      throw new Error('PAYSTACK_SECRET_KEY is not set');
    }
    return key;
  }

  async initiatePayment(
    userId: string,
    shippingAddressId: string,
  ): Promise<string> {
    console.log(userId);
    const cart = await this.cartsService.getOrCreateCart(userId);

    const total = await this.cartsService.getCartTotal(userId);
    const shippingAddress = await this.shippingAddresssService.findOne(
      shippingAddressId,
      userId,
    );

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if the cart is empty
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const paymentData: PaystackCreateTransactionDto = {
      amount: total * 100, // Paystack expects amount in kobo
      email: user.email,
      metadata: {
        user_id: userId,
        cart_id: cart.id,
        shipping_address_id: shippingAddress.id,
        custom_fields: [
          {
            display_name: 'Cart ID',
            variable_name: 'cart_id',
            value: cart.id,
          },
        ],
      },
    };

    const callbackUrl = this.configService.get(
      'PAYSTACK_CALLBACK_URL',
    ) as string;
    if (callbackUrl) {
      paymentData.callback_url = callbackUrl;
    }
    try {
      const response = await axios.post<PaystackCreateTransactionResponseDto>(
        PAYSTACK_TRANSACTION_INI_URL,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${this.getPaystackSecretKey()}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.data.authorization_url;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Error initializing payment');
    }
  }

  async verifyPayment(query: string): Promise<void> {
    const reference = query;

    const existingOrder = await this.prisma.order.findFirst({
      where: { paymentReference: reference },
    });
    console.log(existingOrder);

    if (existingOrder && existingOrder.status === OrderStatus.PAID) {
      throw new ConflictException('Order has already been verified ');
    }

    try {
      const response = await axios.get<PaystackVerifyTransactionResponseDto>(
        `${PAYSTACK_TRANSACTION_VERIFY_BASE_URL}/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.getPaystackSecretKey()}`,
          },
        },
      );

      if (
        response.data.status &&
        response.data.data.status === PAYSTACK_SUCCESS_STATUS
      ) {
        const cartId = response.data.data.metadata.cart_id;
        const userId = response.data.data.metadata.user_id.toString();
        const shippingAddressId =
          response.data.data.metadata.shipping_address_id;

        const cart = await this.prisma.cart.findUnique({
          where: { id: cartId },
          include: { items: { include: { product: true } } },
        });

        if (!cart) {
          throw new BadRequestException('Cart not found');
        }

        const total = cart.items.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0,
        );

        await this.ordersService.createOrder({
          userId,
          total,
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
          shipping_address_id: shippingAddressId,
          reference: reference,
        });

        await this.prisma.cartItem.deleteMany({ where: { cartId } });
      } else {
        throw new BadRequestException('Payment verification failed');
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Error Verifiying payment');
    }
  }
}
