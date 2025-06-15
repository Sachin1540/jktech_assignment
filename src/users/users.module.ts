import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  // Register the User entity for dependency injection via TypeORM
  imports: [TypeOrmModule.forFeature([User])],

  // Service to handle business logic
  providers: [UsersService],

  // Controller to handle incoming HTTP requests
  controllers: [UsersController],

  // Export service for use in other modules (e.g., AuthModule)
  exports: [UsersService],
})
export class UsersModule {}
