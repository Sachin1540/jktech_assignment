/**
 * Controller responsible for managing user-related operations such as
 * registration, retrieval, updating roles, and deletion.
 */
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateRoleDto } from './dto/user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { Response } from 'express';
import { Res } from '@nestjs/common';

@ApiTags('User')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Registers a new user.
   * @param dto CreateUserDto containing email, password, and optional role.
   * @returns Result of registration operation.
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation or registration error',
  })
  async register(@Body() dto: CreateUserDto) {
    try {
      const payload: CreateUserDto = {
        email: dto.email,
        password: dto.password,
        role: dto.role || Role.USER,
      };
      return await this.usersService.register(payload);
    } catch (error) {
      return {
        success: false,
        message: 'Registration failed',
        error: error?.message || error,
      };
    }
  }

  /**
   * Retrieves all registered users.
   * Restricted to ADMIN role.
   * @returns List of all users.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of all users' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Access denied' })
  async getAllUsers() {
    try {
      const users = await this.usersService.findAll();
      return users;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get users',
        error: error?.message || error,
      };
    }
  }

  /**
   * Retrieves a specific user by their ID.
   * Restricted to ADMIN role.
   * @param id ID of the user to retrieve.
   * @param res Express response object.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User details' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const user = await this.usersService.findById(id);
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Failed to get user',
        error: error?.message || 'Unknown error',
      });
    }
  }

  /**
   * Updates a user's role.
   * Restricted to ADMIN role.
   * @param res Express response object.
   * @param id ID of the user to update.
   * @param body UpdateRoleDto containing the new role.
   */
  @Put(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'User role updated' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid role update',
  })
  async updateUserRole(
    @Res() res: Response,
    @Param('id') id: number,
    @Body() body: UpdateRoleDto,
  ) {
    try {
      const result = await this.usersService.updateRole(+id, body.role);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        message: error.message || 'Something went wrong',
      });
    }
  }

  /**
   * Deletes a user by ID.
   * Restricted to ADMIN role.
   * @param id ID of the user to delete.
   * @param res Express response object.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Delete failed' })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    try {
      const result = await this.usersService.remove(+id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(error.status || 500).json({
        message: error.message || 'Something went wrong',
      });
    }
  }
}
