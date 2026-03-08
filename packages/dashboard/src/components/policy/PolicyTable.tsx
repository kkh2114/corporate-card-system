import React from 'react';
import { Table, Tag, Button, Space, Switch } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { CardPolicy } from '@/types/models.types';
import { formatDate } from '@/utils/format';

interface PolicyTableProps {
  data: CardPolicy[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetail: (id: string) => void;
  onEdit: (policy: CardPolicy) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export const PolicyTable: React.FC<PolicyTableProps> = ({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onViewDetail,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const columns: ColumnsType<CardPolicy> = [
    {
      title: '정책명',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '설명',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: true,
    },
    {
      title: '규칙 수',
      dataIndex: 'rules',
      key: 'rules',
      width: 80,
      align: 'center',
      render: (rules: unknown[]) => rules.length,
    },
    {
      title: '적용 부서',
      dataIndex: 'appliedDepartments',
      key: 'appliedDepartments',
      width: 200,
      render: (depts: string[]) =>
        depts.map((d) => <Tag key={d}>{d}</Tag>),
    },
    {
      title: '활성',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => onToggleActive(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: '수정일',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => formatDate(date, 'YYYY-MM-DD'),
    },
    {
      title: '액션',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => onViewDetail(record.id)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => onDelete(record.id)} />
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
        showTotal: (t) => `총 ${t}개`,
        onChange: onPageChange,
      }}
      scroll={{ x: 1100 }}
      size="middle"
    />
  );
};
