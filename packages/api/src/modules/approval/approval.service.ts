import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApprovalRequest,
  ApprovalStep,
  ApprovalStatus,
  ApprovalTrigger,
} from './entities/approval-request.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { ApprovalAction } from './dto/process-approval.dto';
import { EmployeeRole } from '../employees/entities/employee.entity';

@Injectable()
export class ApprovalService {
  // 승인 요청 만료 시간 (24시간)
  private readonly EXPIRY_HOURS = 24;

  constructor(
    @InjectRepository(ApprovalRequest)
    private readonly requestRepo: Repository<ApprovalRequest>,
    @InjectRepository(ApprovalStep)
    private readonly stepRepo: Repository<ApprovalStep>,
  ) {}

  async createApprovalRequest(
    requesterId: string,
    dto: CreateApprovalDto,
  ): Promise<ApprovalRequest> {
    const approvalChain = this.determineApprovalChain(
      dto.trigger,
      dto.exceededAmount,
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.EXPIRY_HOURS);

    const request = this.requestRepo.create({
      transactionId: dto.transactionId,
      requesterId,
      trigger: dto.trigger,
      requestedAmount: dto.requestedAmount,
      exceededAmount: dto.exceededAmount,
      reason: dto.reason,
      currentStep: 0,
      totalSteps: approvalChain.length,
      expiresAt,
    });

    const savedRequest = await this.requestRepo.save(request);

    // 승인 단계 생성
    const steps = approvalChain.map((role, index) =>
      this.stepRepo.create({
        approvalRequestId: savedRequest.id,
        stepOrder: index,
        approverRole: role,
        status: index === 0 ? ApprovalStatus.PENDING : ApprovalStatus.PENDING,
      }),
    );

    await this.stepRepo.save(steps);

    return this.findOne(savedRequest.id);
  }

  async processStep(
    requestId: string,
    approverId: string,
    approverRole: string,
    action: ApprovalAction,
    comment?: string,
  ): Promise<ApprovalRequest> {
    const request = await this.findOne(requestId);

    // 만료 확인
    if (request.expiresAt && new Date() > request.expiresAt) {
      request.status = ApprovalStatus.EXPIRED;
      await this.requestRepo.save(request);
      throw new ForbiddenException('승인 요청이 만료되었습니다.');
    }

    // 이미 처리된 요청인지 확인
    if (
      request.status === ApprovalStatus.APPROVED ||
      request.status === ApprovalStatus.REJECTED ||
      request.status === ApprovalStatus.EXPIRED ||
      request.status === ApprovalStatus.CANCELLED
    ) {
      throw new ForbiddenException('이미 처리된 승인 요청입니다.');
    }

    // 현재 단계의 승인자 역할 확인
    const currentStep = request.steps.find(
      (s) => s.stepOrder === request.currentStep,
    );

    if (!currentStep) {
      throw new NotFoundException('현재 승인 단계를 찾을 수 없습니다.');
    }

    if (currentStep.approverRole !== approverRole) {
      throw new ForbiddenException(
        `현재 단계는 ${currentStep.approverRole} 역할의 승인이 필요합니다.`,
      );
    }

    // 단계 처리
    currentStep.approverId = approverId;
    currentStep.comment = comment;
    currentStep.actedAt = new Date();

    if (action === ApprovalAction.REJECT) {
      currentStep.status = ApprovalStatus.REJECTED;
      request.status = ApprovalStatus.REJECTED;
      await this.stepRepo.save(currentStep);
      await this.requestRepo.save(request);
      return this.findOne(requestId);
    }

    // 승인 처리
    currentStep.status = ApprovalStatus.APPROVED;
    await this.stepRepo.save(currentStep);

    // 다음 단계가 있는지 확인
    if (request.currentStep < request.totalSteps - 1) {
      request.currentStep += 1;
      request.status = ApprovalStatus.ESCALATED;
    } else {
      request.status = ApprovalStatus.APPROVED;
    }

    await this.requestRepo.save(request);
    return this.findOne(requestId);
  }

  async findOne(id: string): Promise<ApprovalRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['steps', 'requester'],
      order: { steps: { stepOrder: 'ASC' } },
    });

    if (!request) {
      throw new NotFoundException(`승인 요청 #${id}을 찾을 수 없습니다.`);
    }

    return request;
  }

  async findByTransaction(transactionId: string): Promise<ApprovalRequest[]> {
    return this.requestRepo.find({
      where: { transactionId },
      relations: ['steps', 'requester'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingByRole(role: string): Promise<ApprovalRequest[]> {
    return this.requestRepo
      .createQueryBuilder('req')
      .innerJoinAndSelect('req.steps', 'step')
      .leftJoinAndSelect('req.requester', 'requester')
      .where('req.status IN (:...statuses)', {
        statuses: [ApprovalStatus.PENDING, ApprovalStatus.ESCALATED],
      })
      .andWhere('step.step_order = req.current_step')
      .andWhere('step.approver_role = :role', { role })
      .andWhere('step.status = :pending', { pending: ApprovalStatus.PENDING })
      .andWhere('(req.expires_at IS NULL OR req.expires_at > :now)', { now: new Date() })
      .orderBy('req.created_at', 'ASC')
      .getMany();
  }

  async cancelRequest(requestId: string, requesterId: string): Promise<ApprovalRequest> {
    const request = await this.findOne(requestId);

    if (request.requesterId !== requesterId) {
      throw new ForbiddenException('본인의 승인 요청만 취소할 수 있습니다.');
    }

    if (
      request.status !== ApprovalStatus.PENDING &&
      request.status !== ApprovalStatus.ESCALATED
    ) {
      throw new ForbiddenException('대기 중인 요청만 취소할 수 있습니다.');
    }

    request.status = ApprovalStatus.CANCELLED;
    await this.requestRepo.save(request);
    return this.findOne(requestId);
  }

  /**
   * 초과 금액에 따른 승인 체인 결정
   */
  private determineApprovalChain(
    trigger: ApprovalTrigger,
    exceededAmount?: number,
  ): string[] {
    switch (trigger) {
      case ApprovalTrigger.LIMIT_EXCEEDED:
        return this.getLimitExceededChain(exceededAmount || 0);

      case ApprovalTrigger.HIGH_AMOUNT:
        return [EmployeeRole.MANAGER];

      case ApprovalTrigger.AFTER_HOURS:
        return [EmployeeRole.MANAGER];

      case ApprovalTrigger.LOCATION_MISMATCH:
        return [EmployeeRole.MANAGER];

      case ApprovalTrigger.MANUAL_FLAG:
        return [EmployeeRole.MANAGER];

      case ApprovalTrigger.RESTRICTED_CATEGORY:
        // 제한 업종은 승인 불가 (차단)
        return [EmployeeRole.ADMIN];

      default:
        return [EmployeeRole.MANAGER];
    }
  }

  private getLimitExceededChain(exceededAmount: number): string[] {
    if (exceededAmount <= 100000) {
      // ~10만원: 부서장 1단계
      return [EmployeeRole.MANAGER];
    }

    if (exceededAmount <= 500000) {
      // 10~50만원: 부서장 -> 재무팀 2단계
      return [EmployeeRole.MANAGER, EmployeeRole.FINANCE];
    }

    // 50만원 초과: 부서장 -> 재무팀 -> 관리자 3단계
    return [EmployeeRole.MANAGER, EmployeeRole.FINANCE, EmployeeRole.ADMIN];
  }
}
