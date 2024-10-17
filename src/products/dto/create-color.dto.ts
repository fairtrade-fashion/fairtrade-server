import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateColorDto {
  @ApiProperty({ description: 'The name of the color' })
  @IsString()
  name: string;
}
