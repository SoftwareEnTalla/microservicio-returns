import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ReturnsLifecycleService } from './returns-lifecycle.service';

@ApiTags('returns-lifecycle')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Autenticación requerida.' })
@Controller('returns-lifecycle')
export class ReturnsLifecycleController {
  constructor(private readonly service: ReturnsLifecycleService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen agregado del lifecycle operativo de returns' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Resumen operativo de returns.' })
  async getSummary(@Query('limit') limit?: string): Promise<Record<string, unknown>> {
    return this.service.getSummary(Number(limit || 8));
  }

  @Post('returns/:returnId/approve')
  @ApiOperation({ summary: 'Aprueba la devolución para procesamiento' })
  @ApiParam({ name: 'returnId', type: String })
  async approveReturn(
    @Param('returnId') returnId: string,
    @Body() body: { reason?: string },
    @Headers('authorization') authorization?: string,
  ): Promise<Record<string, unknown>> {
    return this.service.approveReturn(returnId, body, authorization);
  }

  @Post('returns/:returnId/reject')
  @ApiOperation({ summary: 'Rechaza la devolución' })
  @ApiParam({ name: 'returnId', type: String })
  async rejectReturn(
    @Param('returnId') returnId: string,
    @Body() body: { reason?: string },
    @Headers('authorization') authorization?: string,
  ): Promise<Record<string, unknown>> {
    return this.service.rejectReturn(returnId, body, authorization);
  }

  @Post('returns/:returnId/schedule-pickup')
  @ApiOperation({ summary: 'Coordina recogida inversa para la devolución' })
  @ApiParam({ name: 'returnId', type: String })
  async schedulePickup(
    @Param('returnId') returnId: string,
    @Body() body: { scheduledAt?: string; transporterId?: string; reason?: string },
    @Headers('authorization') authorization?: string,
  ): Promise<Record<string, unknown>> {
    return this.service.schedulePickup(returnId, body, authorization);
  }

  @Post('returns/:returnId/inspection')
  @ApiOperation({ summary: 'Registra el resultado de inspección de la devolución' })
  @ApiParam({ name: 'returnId', type: String })
  async registerInspection(
    @Param('returnId') returnId: string,
    @Body() body: { inspectionOutcome?: string; restockDecision?: string; reason?: string },
    @Headers('authorization') authorization?: string,
  ): Promise<Record<string, unknown>> {
    return this.service.registerInspection(returnId, body, authorization);
  }

  @Post('returns/:returnId/restock')
  @ApiOperation({ summary: 'Completa la resolución de reposición a stock' })
  @ApiParam({ name: 'returnId', type: String })
  async completeRestock(
    @Param('returnId') returnId: string,
    @Body() body: { restockDecision?: string; receivedAt?: string; skuId?: string; warehouseId?: string; quantity?: number; reason?: string },
    @Headers('authorization') authorization?: string,
  ): Promise<Record<string, unknown>> {
    return this.service.completeRestock(returnId, body, authorization);
  }

  @Post('returns/:returnId/request-refund')
  @ApiOperation({ summary: 'Dispara o actualiza la solicitud de refund' })
  @ApiParam({ name: 'returnId', type: String })
  async requestRefund(
    @Param('returnId') returnId: string,
    @Body() body: { refundStatus?: string; amount?: number; reason?: string },
    @Headers('authorization') authorization?: string,
  ): Promise<Record<string, unknown>> {
    return this.service.requestRefund(returnId, body, authorization);
  }
}