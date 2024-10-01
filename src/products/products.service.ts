// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, Prisma } from '@prisma/client';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto.';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProductsService {
  private lowStockThreshold: number;
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.lowStockThreshold = this.configService.get('LOW_STOCK_THRESHOLD') || 5;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { categoryId, imageUrls, ...productData } = createProductDto;

    try {
      return await this.prisma.product.create({
        data: {
          ...productData,
          category: { connect: { id: categoryId } },
          images: imageUrls
            ? { create: imageUrls.map((url) => ({ url })) }
            : undefined,
        },
        include: { category: true, images: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'A product with this name or SKU already exists',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid category ID');
        }
      }
      throw error;
    }
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }): Promise<{ products: Product[]; total: number }> {
    const { skip, take, orderBy } = params;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take,
        orderBy,
        include: { category: true, images: true },
      }),
      this.prisma.product.count(),
    ]);

    return { products, total };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const { categoryId, imageUrls, ...productData } = updateProductDto;

    try {
      return await this.prisma.product.update({
        where: { id },
        data: {
          ...productData,
          category: categoryId ? { connect: { id: categoryId } } : undefined,
          images: imageUrls
            ? {
                deleteMany: {},
                create: imageUrls.map((url) => ({ url })),
              }
            : undefined,
        },
        include: { category: true, images: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'A product with this name already exists',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid category ID');
        }
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }
      }
      throw error;
    }
  }

  async searchProducts(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ProductWhereUniqueInput;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
  }): Promise<{ products: Product[]; total: number }> {
    const { skip, take, cursor, where, orderBy } = params;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take,
        cursor,
        where,
        orderBy,
        include: {
          category: true,
          images: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async updateProductStock(
    productId: string,
    quantity: number,
  ): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    });

    if (product.stock <= this.lowStockThreshold) {
      await this.sendLowStockAlert(product);
    }

    return product;
  }

  private async sendLowStockAlert(product: Product): Promise<void> {
    const adminEmails = await this.getAdminEmails();
    for (const email of adminEmails) {
      await this.emailService.sendLowStockAlert(email, product);
    }
  }

  private async getAdminEmails(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    });
    return admins.map((admin) => admin.email);
  }

  async getLowStockProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: { stock: { lte: this.lowStockThreshold } },
      include: { category: true },
    });
  }
}
