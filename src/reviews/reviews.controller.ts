import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({
    status: 201,
    description: 'The review has been successfully created.',
    schema: {
      example: {
        id: 'review-id-1',
        productId: 'product-id-1',
        userId: 'user-id-1',
        rating: 4.5,
        comment: 'Great product!',
        createdAt: '2024-09-30T12:34:56Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Req() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(req.user.userId, createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({
    status: 200,
    description: 'Return all reviews.',
    schema: {
      example: [
        {
          id: 'review-id-1',
          productId: 'product-id-1',
          userId: 'user-id-1',
          rating: 4.5,
          comment: 'Great product!',
          createdAt: '2024-09-30T12:34:56Z',
        },
        {
          id: 'review-id-2',
          productId: 'product-id-2',
          userId: 'user-id-2',
          rating: 3.0,
          comment: 'Average quality.',
          createdAt: '2024-09-29T11:00:00Z',
        },
      ],
    },
  })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the review.',
    schema: {
      example: {
        id: 'review-id-1',
        productId: 'product-id-1',
        userId: 'user-id-1',
        rating: 4.5,
        comment: 'Great product!',
        createdAt: '2024-09-30T12:34:56Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({
    status: 200,
    description: 'The review has been successfully updated.',
    schema: {
      example: {
        id: 'review-id-1',
        productId: 'product-id-1',
        userId: 'user-id-1',
        rating: 5.0,
        comment: 'Updated comment: Amazing product!',
        updatedAt: '2024-09-30T13:00:00Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({
    status: 200,
    description: 'The review has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
