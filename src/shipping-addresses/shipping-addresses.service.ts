import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';
import { Address } from '@prisma/client';

@Injectable()
export class ShippingAddressesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    createShippingAddressDto: CreateShippingAddressDto,
  ): Promise<Address> {
    try {
      const address = await this.prisma.address.create({
        data: {
          city: createShippingAddressDto.city,
          country: createShippingAddressDto.country,
          fullName: createShippingAddressDto.fullName,
          phoneNumber: createShippingAddressDto.phoneNumber,
          state: createShippingAddressDto.state,
          streetAddress: createShippingAddressDto.streetAddress,
          zipCode: createShippingAddressDto.zipCode,
          user: { connect: { id: userId } },
        },
      });
      console.log(address);
      return address;
    } catch (error) {
      console.log(error);
    }
  }

  async findAll(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId },
    });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException(`Shipping address with ID ${id} not found`);
    }

    if (address.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this shipping address',
      );
    }

    return address;
  }

  async update(
    id: string,
    userId: string,
    updateShippingAddressDto: UpdateShippingAddressDto,
  ): Promise<Address> {
    await this.findOne(id, userId); // This will throw an error if the address doesn't exist or doesn't belong to the user

    return this.prisma.address.update({
      where: { id },
      data: updateShippingAddressDto,
    });
  }

  async remove(id: string, userId: string): Promise<Address> {
    await this.findOne(id, userId); // This will throw an error if the address doesn't exist or doesn't belong to the user

    return this.prisma.address.delete({
      where: { id },
    });
  }
}
