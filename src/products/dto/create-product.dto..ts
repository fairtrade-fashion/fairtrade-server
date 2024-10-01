import {
  IsString,
  IsNumber,
  IsPositive,
  IsArray,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'The name of the product' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'The description of the product' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'The price of the product' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ description: 'The stock quantity of the product' })
  @IsNumber()
  @IsPositive()
  stock: number;

  @ApiProperty({ description: 'The category ID of the product' })
  @IsString()
  categoryId: string;

  @ApiProperty({
    description: 'The image URLs of the product',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  imageUrls?: string[];

  @ApiProperty({ description: 'The Stock Keeping Unit (SKU) of the product' })
  @IsString()
  sku: string;
}
