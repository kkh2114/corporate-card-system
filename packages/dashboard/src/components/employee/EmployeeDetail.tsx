import React from 'react';
import { Descriptions, Tag, Progress, Card } from 'antd';
import type { Employee } from '@/types/models.types';
import { formatCurrency, formatDate } from '@/utils/format';

interface EmployeeDetailProps {
  employee: Employee;
}

export const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employee }) => {
  const usedAmount = employee.monthlyLimit - employee.remainingLimit;
  const usagePercent = employee.monthlyLimit > 0
    ? Math.round((usedAmount / employee.monthlyLimit) * 100)
    : 0;

  return (
    <div>
      <Descriptions title="직원 정보" bordered column={2}>
        <Descriptions.Item label="사번">{employee.employeeId}</Descriptions.Item>
        <Descriptions.Item label="이름">{employee.name}</Descriptions.Item>
        <Descriptions.Item label="이메일">{employee.email}</Descriptions.Item>
        <Descriptions.Item label="전화번호">{employee.phone}</Descriptions.Item>
        <Descriptions.Item label="부서">{employee.department}</Descriptions.Item>
        <Descriptions.Item label="직급">{employee.position}</Descriptions.Item>
        <Descriptions.Item label="역할">
          <Tag>{employee.role}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <Tag color={employee.isActive ? 'green' : 'default'}>
            {employee.isActive ? '활성' : '비활성'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="등록일">
          {formatDate(employee.createdAt, 'YYYY-MM-DD')}
        </Descriptions.Item>
      </Descriptions>

      <Card title="카드 한도 현황" className="mt-4">
        <div className="flex justify-between mb-2">
          <span>사용액: {formatCurrency(usedAmount)}</span>
          <span>한도: {formatCurrency(employee.monthlyLimit)}</span>
        </div>
        <Progress
          percent={usagePercent}
          strokeColor={usagePercent > 80 ? '#ff4d4f' : '#2563eb'}
        />
        <div className="mt-2 text-gray-500">
          잔여 한도: {formatCurrency(employee.remainingLimit)}
        </div>
      </Card>
    </div>
  );
};
