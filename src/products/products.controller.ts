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
  ParseFloatPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateSizeDto } from './dto/create-size.dto';
import { CreateColorDto } from './dto/create-color.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorators';
import { CreateProductDto } from './dto/create-product.dto.';
import { Prisma } from '@prisma/client';

@ApiTags('products')
@Controller('products')
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Get('search')
  @ApiOperation({ summary: 'Search products with filtering and sorting' })
  @ApiResponse({
    status: 200,
    description: 'Return the search results based on filters and sorting.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'name', required: true })
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
    @Query('name') name: string,
    @Query('category') category?: string,
    @Query('minPrice', new DefaultValuePipe(1), ParseFloatPipe)
    minPrice?: number,
    @Query('maxPrice', new DefaultValuePipe(100000), ParseFloatPipe)
    maxPrice?: number,
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
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
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

  @Get('new-arrivals')
  @ApiOperation({ summary: 'Get new arrivals' })
  @ApiResponse({ status: 200, description: 'Return the latest products.' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getNewArrivals(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.productsService.getNewArrivals(limit);
  }

  @Post('sizes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new size (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The size has been successfully created.',
  })
  createSize(@Body() createSizeDto: CreateSizeDto) {
    return this.productsService.createSize(createSizeDto);
  }

  @Get('sizes')
  @ApiOperation({ summary: 'Get all sizes' })
  @ApiResponse({ status: 200, description: 'Return all sizes.' })
  getSizes() {
    return this.productsService.getSizes();
  }

  @Post('colors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new color (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The color has been successfully created.',
  })
  createColor(@Body() createColorDto: CreateColorDto) {
    return this.productsService.createColor(createColorDto);
  }

  @Get('colors')
  @ApiOperation({ summary: 'Get all colors' })
  @ApiResponse({ status: 200, description: 'Return all colors.' })
  getColors() {
    return this.productsService.getColors();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'The product has been successfully created.',
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, description: 'Return all products.' })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
  ) {
    return this.productsService.findAll({ skip, take });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({ status: 200, description: 'Return the product.' })
  findOne(@Param('id') id: string) {
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
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
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
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // @Get('new-arrivals')
  // @ApiOperation({ summary: 'Get new arrivals' })
  // @ApiResponse({ status: 200, description: 'Return the latest products.' })
  // @ApiQuery({ name: 'limit', required: false, type: Number })
  // getNewArrivals(
  //   @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  // ) {
  //   return this.productsService.getNewArrivals(limit);
  // }
}
