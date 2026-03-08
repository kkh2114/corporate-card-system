import React from 'react';
import { Table, Tag, Button, Space, Progress } from 'antd';
import { EyeOutlined, EditOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Employee } from '@/types/models.types';
import { formatCurrency } from '@/utils/format';

interface EmployeeTableProps {
  data: Employee[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetail: (id: string) => void;
  onEdit: (employee: Employee) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onViewDetail,
  onEdit,
}) => {
  const columns: ColumnsType<Employee> = [
    {
      title: '사번',
      dataIndex: 'employeeId',
      key: 'employeeId',
      width: 100,
    },
    {
      title: '이름',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '부서',
      dataIndex: 'department',
      key: 'department',
      width: 100,
      filters: [
        { text: '영업팀', value: '영업팀' },
        { text: '마케팅팀', value: '마케팅팀' },
        { text: 'IT팀', value: 'IT팀' },
        { text: '재무팀', value: '재무팀' },
        { text: '인사팀', value: '인사팀' },
      ],
    },
    {
      title: '직급',
      dataIndex: 'position',
      key: 'position',
      width: 80,
    },
    {
      title: '월 한도',
      dataIndex: 'monthlyLimit',
      key: 'monthlyLimit',
      width: 130,
      align: 'right',
      render: (limit: number) => formatCurrency(limit),
    },
    {
      title: '한도 사용률',
      key: 'usage',
      width: 180,
      render: (_, record) => {
        const usagePercent = record.monthlyLimit > 0
          ? Math.round(((record.monthlyLimit - record.remainingLimit) / record.monthlyLimit) * 100)
          : 0;
        return (
          <Progress
            percent={usagePercent}
            size="small"
            strokeColor={usagePercent > 80 ? '#ff4d4f' : '#2563eb'}
          />
        );
      },
    },
    {
      title: '상태',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? '활성' : '비활성'}
        </Tag>
      ),
    },
    {
      title: '액션',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onViewDetail(record.id)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t) => `총 ${t}명`,
        onChange: onPageChange,
      }}
      scroll={{ x: 900 }}
      size="middle"
    />
  );
};
