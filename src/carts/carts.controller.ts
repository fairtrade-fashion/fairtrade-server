import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Cart, CartItem } from '@prisma/client';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('carts')
@Controller('carts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  @ApiOperation({ summary: "Get or create user's cart" })
  @ApiResponse({
    status: 200,
    description: "Return the user's cart.",
  })
  async getOrCreateCart(@GetUser() user): Promise<Cart> {
    return this.cartsService.getOrCreateCart(user.userId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiBody({ type: AddToCartDto })
  @ApiResponse({
    status: 201,
    description: 'The item has been successfully added to the cart.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Insufficient stock or invalid product.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Product not found.',
  })
  async addItemToCart(
    @GetUser() user,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartItem> {
    return this.cartsService.addItemToCart(
      user.userId,
      addToCartDto.productId,
      addToCartDto.quantity,
    );
  }

  @Delete('item/:id')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'The ID of the cart item to remove',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'The item has been successfully removed from the cart.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. Cart item not found.',
  })
  async removeItemFromCart(
    @GetUser() user,
    @Param('id') itemId: string,
  ): Promise<{ message: string }> {
    await this.cartsService.removeItemFromCart(user.userId, itemId);
    return { message: 'Item removed successfully' };
  }

  @Get('total')
  @ApiOperation({ summary: 'Get cart total' })
  @ApiResponse({
    status: 200,
    description: 'Returns the total price of items in the cart.',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: 'The total price of all items in the cart',
        },
      },
    },
  })
  async getCartTotal(@GetUser() user): Promise<{ total: number }> {
    const total = await this.cartsService.getCartTotal(user.userId);
    return { total };
  }
}
