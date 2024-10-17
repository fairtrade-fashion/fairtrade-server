import {
  IsString,
  IsNumber,
  IsPositive,
  IsArray,
  IsOptional,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class ProductVariationDto {
  @ApiProperty({ description: 'The ID of the size or color' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'The stock quantity for this variation' })
  @IsNumber()
  @IsPositive()
  stock: number;
}

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

  @ApiProperty({
    description: 'The sizes of the product',
    type: [ProductVariationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationDto)
  sizes: ProductVariationDto[];

  @ApiProperty({
    description: 'The colors of the product',
    type: [ProductVariationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariationDto)
  colors: ProductVariationDto[];
}
