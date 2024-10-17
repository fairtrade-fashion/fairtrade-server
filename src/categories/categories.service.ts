// src/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Category } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, parentId } = createCategoryDto;

    const existingCategory = await this.prisma.category.findUnique({
      where: { name },
    });
    if (existingCategory) {
      throw new ConflictException(`Category with name ${name} already exists`);
    }

    return this.prisma.category.create({
      data: {
        name,

        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
      include: { parent: true },
    });
  }

  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany({
      include: { parent: true, children: true },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: true, children: true, products: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const { name, parentId } = updateCategoryDto;

    if (name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: { name, id: { not: id } },
      });
      if (existingCategory) {
        throw new ConflictException(
          `Category with name ${name} already exists`,
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        name,
        parent: parentId ? { connect: { id: parentId } } : undefined,
      },
      include: { parent: true, children: true },
    });
  }

  async remove(id: string): Promise<Category> {
    return this.prisma.category.delete({
      where: { id },
      include: { parent: true, children: true },
    });
  }
}
