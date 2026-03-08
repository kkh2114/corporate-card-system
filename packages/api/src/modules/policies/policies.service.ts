import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardPolicy } from './entities/card-policy.entity';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectRepository(CardPolicy)
    private readonly policyRepository: Repository<CardPolicy>,
  ) {}

  async create(dto: CreatePolicyDto): Promise<CardPolicy> {
    const policy = this.policyRepository.create(dto);
    return this.policyRepository.save(policy);
  }

  async findByEmployeeId(employeeId: string): Promise<CardPolicy> {
    const policy = await this.policyRepository.findOne({
      where: { employeeId },
      relations: ['employee'],
    });
    if (!policy) {
      throw new NotFoundException(`Policy for employee ${employeeId} not found`);
    }
    return policy;
  }

  async findOne(id: string): Promise<CardPolicy> {
    const policy = await this.policyRepository.findOne({
      where: { id },
      relations: ['employee'],
    });
    if (!policy) {
      throw new NotFoundException(`Policy #${id} not found`);
    }
    return policy;
  }

  async update(id: string, dto: UpdatePolicyDto): Promise<CardPolicy> {
    const policy = await this.findOne(id);
    Object.assign(policy, dto);
    return this.policyRepository.save(policy);
  }
}
