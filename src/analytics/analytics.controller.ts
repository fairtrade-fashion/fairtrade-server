// src/analytics/analytics.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorators';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('total-sales')
  @ApiOperation({ summary: 'Get total sales for a date range' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getTotalSales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getTotalSales(
      startDate,
    endDate,
    );
  }

  @Get('top-selling-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'limit', required: false })
  async getTopSellingProducts(
    @Query('limit', ParseIntPipe) limit: number = 10,
  ) {
    return this.analyticsService.getTopSellingProducts(limit);
  }

  @Get('orders-by-status')

  @ApiOperation({ summary: 'Get order count by status' })
  async getOrdersByStatus() {
    return this.analyticsService.getOrdersByStatus();
  }

  @Get('customer-growth')
  @ApiOperation({ summary: 'Get customer growth over time' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getCustomerGrowth(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.analyticsService.getCustomerGrowth(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
