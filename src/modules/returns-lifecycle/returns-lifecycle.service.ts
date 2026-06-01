import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Returns } from '../returns/entities/returns.entity';
import { ReturnsQueryRepository } from '../returns/repositories/returnsquery.repository';
import { ReturnsCommandService } from '../returns/services/returnscommand.service';

type ReturnsOperationalSignals = {
  pickupCoordinated: boolean;
  inspectionClosed: boolean;
  stockResolution: boolean;
  financialResolution: boolean;
  blockers: string[];
};

@Injectable()
export class ReturnsLifecycleService {
  constructor(
    private readonly returnsQueryRepository: ReturnsQueryRepository,
    private readonly returnsCommandService: ReturnsCommandService,
  ) {}

  async getSummary(limit: number = 8): Promise<Record<string, unknown>> {
    const returns = await this.returnsQueryRepository.findAll({ take: Math.max(limit, 80) });
    const activeReturns = (returns as Returns[]).filter((item) => item?.isActive !== false);
    const latest = [...activeReturns]
      .sort(
        (left, right) =>
          new Date(String(right.modificationDate || right.creationDate || 0)).getTime()
          - new Date(String(left.modificationDate || left.creationDate || 0)).getTime(),
      )
      .slice(0, Math.max(1, Math.min(limit, 20)))
      .map((item) => this.buildReturnSnapshot(item));

    let verificationIssues = 0;
    let closedLoopReturns = 0;
    for (const snapshot of latest) {
      const operationalSignals = snapshot['operationalSignals'] as ReturnsOperationalSignals;
      verificationIssues += operationalSignals.blockers.length;
      if (operationalSignals.inspectionClosed && (operationalSignals.stockResolution || operationalSignals.financialResolution)) {
        closedLoopReturns += 1;
      }
    }

    const totalReturns = activeReturns.length;
    const pickupRequiredReturns = activeReturns.filter((item) => item.pickupRequired).length;
    const approvedReturns = activeReturns.filter((item) => ['APPROVED', 'INSPECTED', 'RESTOCKED', 'REFUND_REQUESTED', 'COMPLETED'].includes(this.normalizeStatus(item.status))).length;
    const rejectedReturns = activeReturns.filter((item) => this.normalizeStatus(item.status) === 'REJECTED').length;
    const receivedReturns = activeReturns.filter((item) => Boolean(item.receivedAt)).length;
    const inspectedReturns = activeReturns.filter((item) => this.hasText(item.inspectionOutcome)).length;
    const restockedReturns = activeReturns.filter((item) => this.isRestocked(item)).length;
    const refundRequestedReturns = activeReturns.filter((item) => this.isRefundOpen(item.refundStatus)).length;
    const refundResolvedReturns = activeReturns.filter((item) => ['REFUNDED', 'COMPLETED', 'SETTLED'].includes(this.normalizeStatus(item.refundStatus))).length;

    return {
      ok: true,
      message: 'Resumen operativo de returns obtenido con éxito.',
      data: {
        totals: {
          totalReturns,
          pickupRequiredReturns,
          approvedReturns,
          rejectedReturns,
          receivedReturns,
          inspectedReturns,
          restockedReturns,
          refundRequestedReturns,
          refundResolvedReturns,
          blockedReturns: Math.max(totalReturns - closedLoopReturns - rejectedReturns, 0),
          readinessCoveragePercent: totalReturns > 0 ? Math.round((closedLoopReturns / totalReturns) * 100) : 0,
          verificationIssues,
        },
        latest,
      },
      count: latest.length,
    };
  }

  async approveReturn(returnId: string, payload: { reason?: string }, _authorization?: string): Promise<Record<string, unknown>> {
    const returnOrder = await this.getReturnOrFail(returnId);
    await this.returnsCommandService.update(returnId, {
      status: 'APPROVED',
      metadata: {
        ...(returnOrder.metadata ?? {}),
        approvedAt: new Date().toISOString(),
        approvalReason: String(payload.reason || '').trim() || 'RETURN_APPROVED',
      },
    } as any);
    return this.buildLifecycleResponse('Devolución aprobada con éxito.', returnId);
  }

  async rejectReturn(returnId: string, payload: { reason?: string }, authorization?: string): Promise<Record<string, unknown>> {
    const returnOrder = await this.getReturnOrFail(returnId);
    const pickup = ((returnOrder.metadata ?? {})['pickup'] ?? {}) as Record<string, unknown>;
    await this.returnsCommandService.update(returnId, {
      status: 'REJECTED',
      metadata: {
        ...(returnOrder.metadata ?? {}),
        rejectedAt: new Date().toISOString(),
        rejectionReason: String(payload.reason || '').trim() || 'RETURN_REJECTED',
      },
    } as any);

    if (this.hasText(pickup['transporterId'])) {
      await this.releaseTransporterWorkload(String(pickup['transporterId']), {
        referenceId: returnId,
        reason: String(payload.reason || '').trim() || 'RETURN_REJECTED',
      }, authorization);
    }
    return this.buildLifecycleResponse('Devolución rechazada con éxito.', returnId);
  }

  async schedulePickup(
    returnId: string,
    payload: { scheduledAt?: string; transporterId?: string; reason?: string },
    authorization?: string,
  ): Promise<Record<string, unknown>> {
    const returnOrder = await this.getReturnOrFail(returnId);
    const scheduledAt = this.resolveDate(payload.scheduledAt, null);
    const transporterId = String(payload.transporterId || '').trim();
    const currentPickup = ((returnOrder.metadata ?? {})['pickup'] ?? {}) as Record<string, unknown>;
    const previousTransporterId = String(currentPickup['transporterId'] || '').trim();
    if (transporterId) {
      await this.ensureTransporterIsAssignable(transporterId, authorization);
      await this.reserveTransporterWorkload(transporterId, {
        referenceId: returnId,
        operationType: 'RETURN_PICKUP',
        returnId,
        orderId: returnOrder.orderId,
        scheduledAt: scheduledAt?.toISOString(),
        reason: String(payload.reason || '').trim() || 'RETURN_PICKUP_COORDINATED',
      }, authorization);
    }
    await this.returnsCommandService.update(returnId, {
      pickupRequired: true,
      metadata: {
        ...(returnOrder.metadata ?? {}),
        pickup: {
          ...((returnOrder.metadata ?? {})['pickup'] ?? {}),
          status: scheduledAt ? 'SCHEDULED' : 'REQUESTED',
          scheduledAt: scheduledAt?.toISOString() ?? null,
          transporterId: transporterId || ((returnOrder.metadata ?? {})['pickup'] ?? {})['transporterId'] || null,
          updatedAt: new Date().toISOString(),
          reason: String(payload.reason || '').trim() || 'RETURN_PICKUP_COORDINATED',
        },
      },
    } as any);

    if (previousTransporterId && previousTransporterId !== transporterId) {
      await this.releaseTransporterWorkload(previousTransporterId, {
        referenceId: returnId,
        reason: 'RETURN_PICKUP_REASSIGNED',
      }, authorization);
    }
    return this.buildLifecycleResponse('Pickup inverso coordinado con éxito.', returnId);
  }

  async registerInspection(
    returnId: string,
    payload: { inspectionOutcome?: string; restockDecision?: string; reason?: string },
    authorization?: string,
  ): Promise<Record<string, unknown>> {
    const inspectionOutcome = String(payload.inspectionOutcome || '').trim().toUpperCase();
    if (!inspectionOutcome) {
      throw new BadRequestException('inspectionOutcome es obligatorio para registrar la inspección.');
    }

    const returnOrder = await this.getReturnOrFail(returnId);
    const pickup = ((returnOrder.metadata ?? {})['pickup'] ?? {}) as Record<string, unknown>;
    await this.returnsCommandService.update(returnId, {
      status: 'INSPECTED',
      inspectionOutcome,
      restockDecision: String(payload.restockDecision || '').trim().toUpperCase() || returnOrder.restockDecision,
      receivedAt: returnOrder.receivedAt ?? new Date(),
      metadata: {
        ...(returnOrder.metadata ?? {}),
        inspectionAt: new Date().toISOString(),
        inspectionReason: String(payload.reason || '').trim() || 'RETURN_INSPECTED',
        pickup: {
          ...pickup,
          status: returnOrder.pickupRequired ? 'COMPLETED' : pickup['status'] || null,
          completedAt: new Date().toISOString(),
        },
      },
    } as any);

    if (this.hasText(pickup['transporterId'])) {
      await this.releaseTransporterWorkload(String(pickup['transporterId']), {
        referenceId: returnId,
        reason: String(payload.reason || '').trim() || 'RETURN_INSPECTED',
      }, authorization);
    }
    return this.buildLifecycleResponse('Inspección registrada con éxito.', returnId);
  }

  async completeRestock(
    returnId: string,
    payload: { restockDecision?: string; receivedAt?: string; skuId?: string; warehouseId?: string; quantity?: number; reason?: string },
    _authorization?: string,
  ): Promise<Record<string, unknown>> {
    const returnOrder = await this.getReturnOrFail(returnId);
    const restockQuantity = Number(payload.quantity ?? (returnOrder.metadata ?? {})['quantity'] ?? 0);
    await this.returnsCommandService.update(returnId, {
      status: 'RESTOCKED',
      restockDecision: String(payload.restockDecision || '').trim().toUpperCase() || 'RESTOCKED',
      receivedAt: this.resolveDate(payload.receivedAt, returnOrder.receivedAt ?? new Date()),
      metadata: {
        ...(returnOrder.metadata ?? {}),
        restockedAt: new Date().toISOString(),
        restockReason: String(payload.reason || '').trim() || 'RETURN_RESTOCKED',
        skuId: String(payload.skuId || (returnOrder.metadata ?? {})['skuId'] || '').trim() || null,
        warehouseId: String(payload.warehouseId || (returnOrder.metadata ?? {})['warehouseId'] || '').trim() || null,
        quantity: Number.isFinite(restockQuantity) && restockQuantity > 0 ? restockQuantity : null,
      },
    } as any);
    return this.buildLifecycleResponse('Resolución de restock aplicada con éxito.', returnId);
  }

  async requestRefund(
    returnId: string,
    payload: { refundStatus?: string; amount?: number; reason?: string },
    _authorization?: string,
  ): Promise<Record<string, unknown>> {
    const returnOrder = await this.getReturnOrFail(returnId);
    const refundStatus = String(payload.refundStatus || '').trim().toUpperCase() || 'REQUESTED';
    const refundAmount = Number(payload.amount ?? (returnOrder.metadata ?? {})['refundAmount'] ?? ((returnOrder.metadata ?? {})['refund'] as Record<string, unknown> | undefined)?.['amount'] ?? 0);
    await this.returnsCommandService.update(returnId, {
      status: this.normalizeStatus(returnOrder.status) === 'REJECTED' ? returnOrder.status : 'REFUND_REQUESTED',
      refundStatus,
      metadata: {
        ...(returnOrder.metadata ?? {}),
        refundAmount: Number.isFinite(refundAmount) && refundAmount > 0 ? refundAmount : 0,
        refundRequestedAmount: Number.isFinite(refundAmount) && refundAmount > 0 ? refundAmount : 0,
        refund: {
          ...((returnOrder.metadata ?? {})['refund'] ?? {}),
          status: refundStatus,
          amount: Number.isFinite(refundAmount) && refundAmount > 0 ? refundAmount : 0,
          requestedAt: new Date().toISOString(),
          reason: String(payload.reason || '').trim() || 'RETURN_REFUND_REQUESTED',
        },
      },
    } as any);
    return this.buildLifecycleResponse('Solicitud de refund actualizada con éxito.', returnId);
  }

  private async buildLifecycleResponse(message: string, returnId: string): Promise<Record<string, unknown>> {
    const returnOrder = await this.getReturnOrFail(returnId);
    return {
      ok: true,
      message,
      data: this.buildReturnSnapshot(returnOrder),
    };
  }

  private buildReturnSnapshot(returnOrder: Returns): Record<string, unknown> {
    const operationalSignals = this.buildOperationalSignals(returnOrder);
    return {
      id: returnOrder.id,
      returnOrderCode: returnOrder.returnOrderCode,
      status: returnOrder.status,
      orderId: returnOrder.orderId,
      shipmentId: returnOrder.shipmentId,
      reasonCode: returnOrder.reasonCode,
      pickupRequired: returnOrder.pickupRequired,
      inspectionOutcome: returnOrder.inspectionOutcome ?? null,
      refundStatus: returnOrder.refundStatus ?? null,
      restockDecision: returnOrder.restockDecision ?? null,
      receivedAt: returnOrder.receivedAt ?? null,
      metadata: returnOrder.metadata ?? {},
      operationalSignals,
    };
  }

  private buildOperationalSignals(returnOrder: Returns): ReturnsOperationalSignals {
    const blockers: string[] = [];
    const pickup = ((returnOrder.metadata ?? {})['pickup'] ?? {}) as Record<string, unknown>;
    const pickupCoordinated = !returnOrder.pickupRequired || ['REQUESTED', 'SCHEDULED', 'COMPLETED'].includes(this.normalizeStatus(pickup['status']));
    const inspectionClosed = this.hasText(returnOrder.inspectionOutcome);
    const stockResolution = this.hasText(returnOrder.restockDecision);
    const financialResolution = this.hasText(returnOrder.refundStatus);

    if (returnOrder.pickupRequired && !pickupCoordinated) {
      blockers.push('pickup inverso pendiente de coordinación');
    }
    if (!inspectionClosed && this.normalizeStatus(returnOrder.status) !== 'REJECTED') {
      blockers.push('devolución sin inspección cerrada');
    }
    if (!stockResolution && !financialResolution && this.normalizeStatus(returnOrder.status) !== 'REJECTED') {
      blockers.push('sin resolución de stock o refund');
    }

    return {
      pickupCoordinated,
      inspectionClosed,
      stockResolution,
      financialResolution,
      blockers,
    };
  }

  private isRestocked(item: Returns): boolean {
    return ['RESTOCKED', 'RESTOCK_COMPLETED'].includes(this.normalizeStatus(item.status))
      || ['RESTOCK', 'RESTOCKED', 'RETURN_TO_STOCK'].includes(this.normalizeStatus(item.restockDecision));
  }

  private isRefundOpen(value: unknown): boolean {
    return ['REQUESTED', 'PENDING', 'IN_PROGRESS', 'APPROVAL_PENDING'].includes(this.normalizeStatus(value));
  }

  private async getReturnOrFail(returnId: string): Promise<Returns> {
    const returnOrder = await this.returnsQueryRepository.findById(returnId);
    if (!returnOrder) {
      throw new NotFoundException(`No existe returns con id ${returnId}.`);
    }
    return returnOrder as Returns;
  }

  private async ensureTransporterIsAssignable(transporterId: string, authorization?: string): Promise<void> {
    const response = await this.fetchTransporterReadiness(transporterId, authorization);
    const operationalSignals = (response?.data?.operationalSignals ?? {}) as Record<string, unknown>;
    const assignable = Boolean(operationalSignals['assignable']);
    if (assignable) {
      return;
    }

    const blockers = Array.isArray(operationalSignals['blockers']) ? operationalSignals['blockers'].join(', ') : 'transportista no asignable';
    throw new BadRequestException(`El transportista ${transporterId} no está listo para logística inversa: ${blockers}.`);
  }

  private async fetchTransporterReadiness(transporterId: string, authorization?: string): Promise<Record<string, any>> {
    const timeoutMs = Number(process.env.UPSTREAM_REQUEST_TIMEOUT_MS || '5000');
    const response = await fetch(`${this.getTransporterBaseUrl()}/transporter-lifecycle/transporters/${transporterId}/readiness`, {
      headers: {
        Accept: 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new BadRequestException(`No se pudo validar readiness del transportista ${transporterId}.`);
    }

    return response.json() as Promise<Record<string, any>>;
  }

  private async reserveTransporterWorkload(
    transporterId: string,
    payload: { referenceId: string; operationType: string; returnId: string; orderId?: string | null; scheduledAt?: string; reason: string },
    authorization?: string,
  ): Promise<void> {
    const timeoutMs = Number(process.env.UPSTREAM_REQUEST_TIMEOUT_MS || '5000');
    const response = await fetch(`${this.getTransporterBaseUrl()}/transporter-lifecycle/transporters/${transporterId}/reserve-workload`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new BadRequestException(`No se pudo reservar capacidad viva del transportista ${transporterId}.`);
    }
  }

  private async releaseTransporterWorkload(
    transporterId: string,
    payload: { referenceId: string; reason: string },
    authorization?: string,
  ): Promise<void> {
    const timeoutMs = Number(process.env.UPSTREAM_REQUEST_TIMEOUT_MS || '5000');
    const response = await fetch(`${this.getTransporterBaseUrl()}/transporter-lifecycle/transporters/${transporterId}/release-workload`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      throw new BadRequestException(`No se pudo liberar capacidad viva del transportista ${transporterId}.`);
    }
  }

  private getTransporterBaseUrl(): string {
    return String(process.env.TRANSPORTER_SERVICE_URL || 'http://transporter-service-app-1:3008/api').replace(/\/$/, '');
  }

  private resolveDate(rawValue: string | undefined, fallback?: Date | null): Date | null {
    if (!String(rawValue || '').trim()) {
      return fallback ?? null;
    }

    const candidate = new Date(String(rawValue));
    if (Number.isNaN(candidate.getTime())) {
      throw new BadRequestException('La fecha suministrada no es válida.');
    }
    return candidate;
  }

  private hasText(value: unknown): boolean {
    return String(value ?? '').trim().length > 0;
  }

  private normalizeStatus(value: unknown): string {
    return String(value ?? '').trim().toUpperCase();
  }
}