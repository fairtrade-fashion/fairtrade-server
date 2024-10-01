// src/users/users.controller.ts
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
import { UsersService } from './users.service';
import { User as UserModel } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorators';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { LoginDto } from 'src/auth/dto/auth.dto';

@ApiTags('users') // Group all users-related routes under the "users" tag
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) // All routes are protected by JWT and RolesGuard
@ApiBearerAuth() // All routes require a Bearer token for authentication
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN') // Only admins can create users
  @ApiOperation({ summary: '[Admin Only] Create a new user' }) // Mark as Admin only
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async createUser(
    @Body() userData: { name?: string; email: string; password: string },
  ): Promise<UserModel> {
    return this.usersService.createUser(userData);
  }

  @Get()
  @Roles('ADMIN') // Only admins can get all users
  @ApiOperation({ summary: '[Admin Only] Get all users' }) // Mark as Admin only
  @ApiResponse({
    status: 200,
    description: 'Return all users.',
  })
  async getAllUsers(): Promise<UserModel[]> {
    return this.usersService.users({});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', description: 'ID of the user to fetch' })
  @ApiResponse({
    status: 200,
    description: 'Return the user.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@Param('id') id: string): Promise<UserModel> {
    return this.usersService.user({ id: String(id) });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'ID of the user to update' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { name: { type: 'string' }, email: { type: 'string' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(
    @Param('id') id: string,
    @Body() userData: { name?: string; email?: string },
  ): Promise<UserModel> {
    return this.usersService.updateUser({
      where: { id: String(id) },
      data: userData,
    });
  }

  @Delete(':id')
  @Roles('ADMIN') // Only admins can delete users
  @ApiOperation({ summary: '[Admin Only] Delete a user' }) // Mark as Admin only
  @ApiParam({ name: 'id', description: 'ID of the user to delete' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async deleteUser(@Param('id') id: string): Promise<UserModel> {
    return this.usersService.deleteUser({ id: String(id) });
  }

  @Post(':id/assign-admin')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign admin role to a user' })
  @ApiResponse({
    status: 200,
    description: 'User has been successfully assigned admin role.',
  })
  async assignAdminRole(@Param('id') id: string) {
    return this.usersService.assignAdminRole(id);
  }

  @Post('seed-admin')
  @ApiOperation({ summary: 'Seed an admin user' })
  @ApiResponse({
    status: 201,
    description: 'Admin user has been successfully created.',
  })
  async seedAdminUser(@Body() userData: LoginDto) {
    return this.usersService.seedAdminUser(userData.email, userData.password);
  }
}
