import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWishlistDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  productId: string;
}
