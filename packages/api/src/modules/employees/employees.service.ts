import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async create(dto: CreateEmployeeDto): Promise<Employee> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const employee = this.employeeRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.employeeRepository.save(employee);
  }

  async findAll(): Promise<Employee[]> {
    return this.employeeRepository.find();
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }
    return employee;
  }

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({ where: { employeeId } });
  }

  async findByEmployeeIdWithPassword(employeeId: string): Promise<Employee | null> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .addSelect('employee.password')
      .where('employee.employeeId = :employeeId', { employeeId })
      .getOne();
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const employee = await this.findOne(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(employee, dto);
    return this.employeeRepository.save(employee);
  }

  async remove(id: string): Promise<void> {
    const employee = await this.findOne(id);
    await this.employeeRepository.remove(employee);
  }

  async updateFcmToken(id: string, fcmToken: string): Promise<void> {
    await this.employeeRepository.update(id, { fcmToken });
  }

  async findByIdWithPassword(id: string): Promise<Employee | null> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .addSelect('employee.password')
      .where('employee.id = :id', { id })
      .getOne();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.employeeRepository.update(id, { password: hashedPassword });
  }
}
