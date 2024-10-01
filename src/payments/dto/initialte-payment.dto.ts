// src/payments/dto/initiate-payment.dto.ts
import {
  IsNotEmpty,
  IsUUID,
  IsEmail,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  callbackUrl: string;
}

export class InitializeTransactionDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;
}
