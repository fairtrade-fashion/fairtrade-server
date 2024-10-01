import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@ApiTags('wishlists')
@ApiBearerAuth()
@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  @ApiOperation({ summary: "Get user's wishlist" })
  @ApiResponse({
    status: 200,
    description: "Return the user's wishlist.",
    schema: {
      example: {
        id: '2adaaa6c-3943-414b-b644-b7b67a987e36',
        userId: '1e3c2841-86db-41b1-b2c8-4e24b1b7b3c5',
        createdAt: '2024-09-30T09:47:24.242Z',
        updatedAt: '2024-09-30T09:47:24.242Z',
        items: [
          {
            id: '17797ed1-36b8-4520-9f43-e396ce0b28e1',
            wishlistId: '2adaaa6c-3943-414b-b644-b7b67a987e36',
            productId: 'b1e904e7-0215-4346-917e-53b9d2e92b46',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWishlist(@Request() req) {
    return this.wishlistsService.getWishlist(req.user.userId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add item to wishlist' })
  @ApiResponse({
    status: 201,
    description: 'The item has been successfully added to the wishlist.',
    schema: {
      example: {
        id: 'id-1ssffer',
        wishlistId: 'whishlist-id',
        productId: 'fsjsdkjsdksdk',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addToWishlist(
    @Request() req,
    @Body() addToWishlistDto: AddToWishlistDto,
  ) {
    return this.wishlistsService.addToWishlist(
      req.user.userId,
      addToWishlistDto.productId,
    );
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove item from wishlist' })
  @ApiResponse({
    status: 200,
    description: 'The item has been successfully removed from the wishlist.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeFromWishlist(
    @Request() req,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.removeFromWishlist(req.user.userId, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear wishlist' })
  @ApiResponse({
    status: 200,
    description: 'The wishlist has been successfully cleared.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearWishlist(@Request() req) {
    return this.wishlistsService.clearWishlist(req.user.userId);
  }
}
