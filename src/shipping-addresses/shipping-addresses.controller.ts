import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ShippingAddressesService } from './shipping-addresses.service';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('shipping-addresses')
@Controller('shipping-addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShippingAddressesController {
  constructor(
    private readonly shippingAddressesService: ShippingAddressesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shipping address' })
  @ApiResponse({
    status: 201,
    description: 'The shipping address has been successfully created.',
  })
  create(
    @GetUser() user,
    @Body() createShippingAddressDto: CreateShippingAddressDto,
  ) {
    return this.shippingAddressesService.create(
      user.userId,
      createShippingAddressDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipping addresses for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return all shipping addresses for the user.',
  })
  findAll(@GetUser() user) {
    return this.shippingAddressesService.findAll(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shipping address by id' })
  @ApiResponse({ status: 200, description: 'Return the shipping address.' })
  @ApiResponse({ status: 404, description: 'Shipping address not found.' })
  findOne(@Param('id') id: string, @GetUser() user) {
    return this.shippingAddressesService.findOne(id, user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shipping address' })
  @ApiResponse({
    status: 200,
    description: 'The shipping address has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Shipping address not found.' })
  update(
    @Param('id') id: string,
    @GetUser() user,
    @Body() updateShippingAddressDto: UpdateShippingAddressDto,
  ) {
    return this.shippingAddressesService.update(
      id,
      user.userId,
      updateShippingAddressDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shipping address' })
  @ApiResponse({
    status: 200,
    description: 'The shipping address has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Shipping address not found.' })
  remove(@Param('id') id: string, @GetUser() user) {
    return this.shippingAddressesService.remove(id, user.userId);
  }
}
