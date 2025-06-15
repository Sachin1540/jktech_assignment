import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { Ingestion } from './entity/ingestion.entity';
import { IngestionRun } from './entity/ingestionrun.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ingestion, IngestionRun])],
  providers: [IngestionService],
  controllers: [IngestionController],
  exports: [IngestionService],
})
export class IngestionModule {}
