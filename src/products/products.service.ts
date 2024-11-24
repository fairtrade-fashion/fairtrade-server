// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Product, Prisma } from '@prisma/client';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto.';
import { EmailService } from 'src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { CreateSizeDto } from './dto/create-size.dto';
import { CreateColorDto } from './dto/create-color.dto';
import { Client } from 'minio';

@Injectable()
export class ProductsService {
  private lowStockThreshold: number;
  private readonly minioClient: Client;
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.lowStockThreshold = this.configService.get('LOW_STOCK_THRESHOLD') || 5;
    this.minioClient = new Client({
      endPoint: this.configService.get('MINIO_ENDPOINT'),
      port: Number(this.configService.get('MINIO_PORT')),
      useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get('MINIO_SECRET_KEY'),
    });
  }

  async createSize(createSizeDto: CreateSizeDto) {
    try {
      return await this.prisma.size.create({
        data: createSizeDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Size already exists');
      }
      throw error;
    }
  }

  async getSizes() {
    return await this.prisma.size.findMany({
      select: {
        name: true,
        id: true,
      },
    });
  }

  async getColors() {
    const color = await this.prisma.color.findMany({
      select: {
        name: true,
        id: true,
      },
    });
    return color;
  }

  async createColor(createColorDto: CreateColorDto) {
    try {
      return await this.prisma.color.create({
        data: createColorDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Color already exists');
      }
      throw error;
    }
  }

  async create(
    files: Express.Multer.File[],
    createProductDto: CreateProductDto,
  ) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('At least one image file is required');
    }

    const bucketName = 'fairtrade-products';
    const imageUrls: string[] = [];

    // Ensure the bucket exists
    const bucketExists = await this.minioClient
      .bucketExists(bucketName)
      .catch(() => false);
    if (!bucketExists) {
      await this.minioClient.makeBucket(bucketName, 'us-east-1');
    }

    // Process each file
    for (const file of files) {
      const uniqueFileName = `${uuidv4()}-${file.originalname}`;
      await this.minioClient.putObject(
        bucketName,
        uniqueFileName,
        file.buffer,
        file.size,
        {
          'Content-Type': file.mimetype,
        },
      );

      // Generate a pre-signed URL for the uploaded file
      const imageUrl = await this.minioClient.presignedGetObject(
        bucketName,
        uniqueFileName,
      );
      imageUrls.push(imageUrl);
    }

    const { categoryId, sizes, colors, stock, description, price, name } =
      createProductDto;
    const parsedSizes = JSON.parse(sizes) as { id: string; stock: number }[];
    const parsedColors = JSON.parse(colors) as { id: string; stock: number }[];
    const parsedStock = Number(stock);
    const parsedPrice = Number(price);

    try {
      const newProduct = await this.prisma.product.create({
        data: {
          name: name,
          description,
          price: parsedPrice,
          stock: parsedStock,
          category: { connect: { id: categoryId } },
          sku: uuidv4(),
          images: imageUrls
            ? { create: imageUrls.map((url) => ({ url })) }
            : undefined,
          sizes: {
            create: parsedSizes.map((size) => ({
              size: { connect: { id: size.id } },
              stock: size.stock,
            })),
          },
          colors: {
            create: parsedColors.map((color) => ({
              color: { connect: { id: color.id } },
              stock: color.stock,
            })),
          },
        },
        include: {
          images: { select: { url: true } },
          sizes: { select: { size: { select: { name: true } }, stock: true } },
          colors: {
            select: { color: { select: { name: true } }, stock: true },
          },
          category: { select: { name: true } },
        },
      });
      return newProduct;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'A product with this name or SKU already exists',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid category, size, or color ID');
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
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          sku: true,
          stock: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              parentId: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
            },
          },
          sizes: {
            select: {
              id: true,
              stock: true,
              size: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          colors: {
            select: {
              id: true,
              stock: true,
              color: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.product.count(),
    ]);

    return { products: products as unknown as Product[], total };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        sku: false,
        stock: true,
        createdAt: true,
        updatedAt: true,
        images: {
          select: {
            id: true,
            url: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            parentId: true,
          },
        },
        sizes: {
          select: {
            id: true,
            stock: true,
            size: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        colors: {
          select: {
            id: true,
            stock: true,
            color: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product as unknown as Product;
  }

  // async update(
  //   id: string,
  //   updateProductDto: UpdateProductDto,
  // ): Promise<Product> {
  //   const { categoryId, sizes, colors, ...productData } = updateProductDto;

  //   try {
  //     return await this.prisma.product.update({
  //       where: { id },
  //       data: {
  //         ...productData,
  //         category: categoryId ? { connect: { id: categoryId } } : undefined,
  //         // images: []
  //         //   ? {
  //         //       deleteMany: {},
  //         //       create: [].map((url) => ({ url })),
  //         //     }
  //         //   : undefined,
  //         // images:["dsd"],
  //         sizes: sizes
  //           ? {
  //               deleteMany: {},
  //               create: sizes.map((size) => ({
  //                 size: { connect: { id: size.id } },
  //                 stock: size.stock,
  //               })),
  //             }
  //           : undefined,
  //         colors: colors
  //           ? {
  //               deleteMany: {},
  //               create: colors.map((color) => ({
  //                 color: { connect: { id: color.id } },
  //                 stock: color.stock,
  //               })),
  //             }
  //           : undefined,
  //       },
  //       include: {
  //         category: true,
  //         images: true,
  //         sizes: { include: { size: true } },
  //         colors: { include: { color: true } },
  //       },
  //     });
  //   } catch (error) {
  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       if (error.code === 'P2025') {
  //         throw new NotFoundException(`Product with ID ${id} not found`);
  //       }
  //       if (error.code === 'P2002') {
  //         throw new BadRequestException(
  //           'A product with this name already exists',
  //         );
  //       }
  //       if (error.code === 'P2003') {
  //         throw new BadRequestException('Invalid category, size, or color ID');
  //       }
  //     }
  //     throw error;
  //   }
  // }

  async update(
    id: string,
    files: Express.Multer.File[],
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const { categoryId, sizes, colors, description, price, name, stock } =
      updateProductDto;

    // Handle image uploads if new files are provided
    const imageUrls: string[] = [];
    if (files && files.length > 0) {
      const bucketName = 'fairtrade-products';

      // Ensure the bucket exists
      const bucketExists = await this.minioClient
        .bucketExists(bucketName)
        .catch(() => false);
      if (!bucketExists) {
        await this.minioClient.makeBucket(bucketName, 'us-east-1');
      }

      // Process each file
      for (const file of files) {
        const uniqueFileName = `${uuidv4()}-${file.originalname}`;
        await this.minioClient.putObject(
          bucketName,
          uniqueFileName,
          file.buffer,
          file.size,
          {
            'Content-Type': file.mimetype,
          },
        );

        // Generate a pre-signed URL for the uploaded file
        const imageUrl = await this.minioClient.presignedGetObject(
          bucketName,
          uniqueFileName,
        );
        imageUrls.push(imageUrl);
      }
    }

    // Parse sizes and colors if provided
    const parsedSizes = sizes
      ? (JSON.parse(sizes) as { id: string; stock: number }[])
      : undefined;
    const parsedColors = colors
      ? (JSON.parse(colors) as { id: string; stock: number }[])
      : undefined;
    const parsedStock = stock ? Number(stock) : undefined;
    const parsedPrice = price ? Number(price) : undefined;

    try {
      // First, fetch the existing product to handle image updates properly
      const existingProduct = await this.prisma.product.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!existingProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      // Prepare the update data
      const updateData: Prisma.ProductUpdateInput = {
        ...(name && { name }),
        ...(description && { description }),
        ...(parsedPrice && { price: parsedPrice }),
        ...(parsedStock && { stock: parsedStock }),
        ...(categoryId && { category: { connect: { id: categoryId } } }),
      };

      // Handle image updates if new files were uploaded
      if (imageUrls.length > 0) {
        updateData.images = {
          deleteMany: {}, // Remove existing images
          create: imageUrls.map((url) => ({ url })),
        };
      }

      // Handle sizes update if provided
      if (parsedSizes) {
        updateData.sizes = {
          deleteMany: {}, // Remove existing sizes
          create: parsedSizes.map((size) => ({
            size: { connect: { id: size.id } },
            stock: size.stock,
          })),
        };
      }

      // Handle colors update if provided
      if (parsedColors) {
        updateData.colors = {
          deleteMany: {}, // Remove existing colors
          create: parsedColors.map((color) => ({
            color: { connect: { id: color.id } },
            stock: color.stock,
          })),
        };
      }

      // Perform the update
      const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              parentId: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
            },
          },
          sizes: {
            select: {
              id: true,
              stock: true,
              size: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          colors: {
            select: {
              id: true,
              stock: true,
              color: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return updatedProduct as unknown as Product;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'A product with this name already exists',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid category, size, or color ID');
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
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          sku: true,
          stock: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              parentId: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
            },
          },
          sizes: {
            select: {
              id: true,
              stock: true,
              size: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          colors: {
            select: {
              id: true,
              stock: true,
              color: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products: products as unknown as Product[], total };
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

  async getNewArrivals(limit: number = 10): Promise<Product[]> {
    return this.prisma.product.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { category: true, images: true },
    });
  }
}
