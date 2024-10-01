import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Wishlist, WishlistItem } from '@prisma/client';

@Injectable()
export class WishlistsService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(
    userId: string,
  ): Promise<Wishlist & { items: WishlistItem[] }> {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!wishlist) {
      return this.createWishlist(userId);
    }

    return wishlist;
  }

  private async createWishlist(
    userId: string,
  ): Promise<Wishlist & { items: WishlistItem[] }> {
    return this.prisma.wishlist.create({
      data: { userId },
      include: { items: true },
    });
  }

  async addToWishlist(
    userId: string,
    productId: string,
  ): Promise<WishlistItem> {
    const wishlist = await this.getWishlist(userId);

    const existingItem = wishlist.items.find(
      (item) => item.productId === productId,
    );

    if (existingItem) {
      throw new NotFoundException('Item already in wishlist');
    }

    return this.prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      },
    });
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const wishlist = await this.getWishlist(userId);

    await this.prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });
  }

  async clearWishlist(userId: string): Promise<void> {
    const wishlist = await this.getWishlist(userId);
    await this.prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id },
    });
  }
}
