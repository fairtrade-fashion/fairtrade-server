// src/reviews/reviews.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

import { Review } from '@prisma/client';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const { productId, rating, comment } = createReviewDto;

    // Check if the user has ordered the product and if the order is delivered
    const order = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException(
        'You can only review products from delivered orders',
      );
    }

    // Check if the user has already reviewed this product
    const existingReview = await this.prisma.review.findFirst({
      where: {
        userId,
        productId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Create the review
    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
    });

    // Update the product's average rating
    await this.updateProductAverageRating(productId);

    return review;
  }

  async findAll(): Promise<Review[]> {
    return this.prisma.review.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
    });

    await this.updateProductAverageRating(review.productId);

    return review;
  }

  async remove(id: string): Promise<Review> {
    const review = await this.prisma.review.delete({
      where: { id },
    });

    await this.updateProductAverageRating(review.productId);

    return review;
  }

  private async updateProductAverageRating(productId: string): Promise<void> {
    const reviews = await this.prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await this.prisma.product.update({
      where: { id: productId },
      data: { averageRating },
    });
  }
}
