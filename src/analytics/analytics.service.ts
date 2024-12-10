import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getTotalSales(startDate?: string, endDate?: string): Promise<{ total_sales:number }> {
    const start = startDate? new Date(startDate) :  new Date('2024-01-01')
    const end = endDate ? new Date(endDate) : new Date()

    const result = await this.prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        status: OrderStatus.PAID,
      },
    });
    return {total_sales:result._sum.total || 0};
  }


  async getTopSellingProducts(limit: number = 10) {
    return this.prisma.orderItem.groupBy({
      by: ['productId'], // This should be a single-level array
      _sum: {
        quantity: true,
        price: true,
      },
      orderBy: [
        {
          _sum: {
            quantity: 'desc',
          },
        },
      ],
      take: limit, // or any other number you need
    });

  }
  async getOrdersByStatus(): Promise<any> {
    return this.prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true, // Define what you're counting (e.g., counting the `status` column)
      },
    });
  }

  async getCustomerGrowth(startDate: Date, endDate: Date): Promise<any[]> {
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
    });



    // Group users by month
    const growthByMonth = users.reduce(
      (acc, user) => {
        const month = new Date(user.createdAt).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month]++;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Convert the object to an array of { month, customerCount } objects
    return Object.entries(growthByMonth).map(([month, customerCount]) => ({
      month,
      customerCount,
    }));
  }
}
