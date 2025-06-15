import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentModule } from './document/document.module';

/**
 * AppModule is the root module of the application.
 * It initializes configuration, database connections, and imports other feature modules.
 */
@Module({
  imports: [
    /**
     * ConfigModule loads environment variables from a `.env` file into process.env
     * Setting `isGlobal: true` makes the configuration available throughout the app without re-importing.
     */
    ConfigModule.forRoot({ isGlobal: true }),

    /**
     * TypeOrmModule connects the app to the PostgreSQL database using async configuration.
     * Configuration is injected via ConfigService, allowing dynamic setup from environment variables.
     */
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', '1234'),
        database: config.get<string>('DB_NAME', 'jktech'),
        // Automatically loads all entities (classes annotated with @Entity)
        autoLoadEntities: true,
        // WARNING: Set to false in production; true syncs the database schema automatically
        synchronize: true,
      }),
    }),

    /**
     * Feature modules
     * AuthModule handles authentication (login, JWT, guards)
     * UsersModule handles user registration, role management, and CRUD
     */
    AuthModule,
    UsersModule,
    DocumentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
