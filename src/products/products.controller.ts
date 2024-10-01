import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Prisma, Product } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorators';
import { CreateProductDto } from './dto/create-product.dto.';

@ApiTags('products')
@Controller('products')
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. Only admins can access this route.',
  })
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({
    status: 200,
    description: 'Return all products.',
    type: Object,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  async getAllProducts(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('orderBy') orderBy?: string,
    @Query('order') order?: 'asc' | 'desc',
  ): Promise<{ products: Product[]; total: number }> {
    return this.productsService.findAll({
      skip,
      take,
      orderBy: orderBy ? { [orderBy]: order || 'asc' } : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the product by ID.',
  })
  async getProductById(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a product (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully updated.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. Only admins can access this route.',
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a product (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully deleted.',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. Only admins can access this route.',
  })
  async deleteProduct(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products with filtering and sorting' })
  @ApiResponse({
    status: 200,
    description: 'Return the search results based on filters and sorting.',
    type: Object,
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['price', 'name', 'createdAt'],
  })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  async searchProducts(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('name') name?: string,
    @Query('category') category?: string,
    @Query('minPrice', ParseIntPipe) minPrice?: number,
    @Query('maxPrice', ParseIntPipe) maxPrice?: number,
    @Query('orderBy') orderBy?: 'price' | 'name' | 'createdAt',
    @Query('order') order?: 'asc' | 'desc',
  ) {
    const where: Prisma.ProductWhereInput = {};
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (category) {
      where.category = { name: { equals: category, mode: 'insensitive' } };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    const orderByOption: Prisma.ProductOrderByWithRelationInput = {};
    if (orderBy) {
      orderByOption[orderBy] = order || 'asc';
    }

    return this.productsService.searchProducts({
      skip,
      take,
      where,
      orderBy: orderByOption,
    });
  }
}
