import { Controller, Post, Get, Query, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaystackCallbackDto } from './types';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate/:shippingAddressId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Initiate a payment',
    description: 'Initiates a payment process for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment initiated successfully.',
    schema: {
      type: 'object',
      properties: {
        authorizationUrl: {
          type: 'string',
          description: 'URL to redirect the user for payment authorization.',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiParam({ name: 'shippingAddressId', required: true, type: String })
  async initiatePayment(
    @GetUser() user,
    @Param('shippingAddressId') shippingAddressId: string,
  ) {
    console.log(user);
    return this.paymentsService.initiatePayment(user.userId, shippingAddressId);
  }

  @Get('verify')
  @ApiOperation({
    summary: 'Verify a payment',
    description: 'Verifies a payment using the Paystack callback data.',
  })
  @ApiQuery({
    type: PaystackCallbackDto,
    description: 'Paystack callback data containing the payment reference.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verified successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Payment verified successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async verifyPayment(@Query('reference') query: string) {
    await this.paymentsService.verifyPayment(query);
    return { message: 'Payment verified successfully' };
  }
}
