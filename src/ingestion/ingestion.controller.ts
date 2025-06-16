import {
  Controller,
  Post,
  UseGuards,
  Req,
  Res,
  HttpStatus,
  Headers,
  Get,
  Param,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IngestionService } from './ingestion.service';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/dto/enum/roles.enum';
import { AuthenticatedRequest } from 'src/common/types/authenticated-request';

/**
 * Controller for handling ingestion-related endpoints.
 *
 * Provides routes for triggering ingestion processes and fetching ingestion run data.
 */
@ApiTags('Ingestion')
@ApiBearerAuth('access-token')
@Controller('ingestion')
export class IngestionController {
  constructor(private ingestionService: IngestionService) {}

  /**
   * Trigger an ingestion process via a secured webhook endpoint.
   *
   * This endpoint is protected by JWT authentication and roles guard,
   * and requires a valid `x-webhook-token` header that matches a secret token.
   *
   * @param token - Webhook token for additional security
   * @param res - HTTP response object
   * @param req - HTTP request object containing the authenticated user
   * @returns JSON response with the result or error message
   */
  @Post('webhook-trigger')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({ summary: 'Trigger ingestion via external webhook' })
  @ApiHeader({
    name: 'x-webhook-token',
    description: 'Secure token for webhook authentication',
    required: true,
  })
  async webhookTrigger(
    @Headers('x-webhook-token') token: string,
    @Res() res: Response,
    @Req() req: AuthenticatedRequest,
  ) {
    const validToken = process.env.WEBHOOK_SECRET;
    if (!token || token !== validToken) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Unauthorized: Invalid or missing webhook token',
      });
    }
    try {
      const result = await this.ingestionService.triggerIngestion(req.user);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Webhook ingestion failed',
        error: error.message || error,
      });
    }
  }

  /**
   * Retrieve a list of all ingestion runs.
   *
   * Accessible only by admin users.
   *
   * @param res - HTTP response object
   * @returns JSON list of ingestion run records
   */
  @Get('runs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all ingestion runs (admin only)' })
  async getAllRuns(@Res() res: Response) {
    const result = await this.ingestionService.getAllIngestionRuns();
    return res.status(HttpStatus.OK).json(result);
  }
}
