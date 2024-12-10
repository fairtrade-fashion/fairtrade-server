import { IsEnum, IsString } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
    @IsString()
    orderId: string;

    @IsEnum(OrderStatus)
    status: OrderStatus;
}
