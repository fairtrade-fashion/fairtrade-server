import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSizeDto {
  @ApiProperty({ description: 'The name of the size' })
  @IsString()
  name: string;
}
