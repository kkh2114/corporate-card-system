import React from 'react';
import { Table, Tag, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Transaction } from '@/types/models.types';
import { formatCurrency, formatDate } from '@/utils/format';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/config';

interface TransactionTableProps {
  data: Transaction[];
  loading?: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onViewDetail: (id: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  data,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onViewDetail,
}) => {
  const columns: ColumnsType<Transaction> = [
    {
      title: '거래일시',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 160,
      render: (date: string) => formatDate(date),
      sorter: true,
    },
    {
      title: '직원명',
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: 100,
    },
    {
      title: '부서',
      dataIndex: 'department',
      key: 'department',
      width: 100,
    },
    {
      title: '가맹점',
      dataIndex: 'merchantName',
      key: 'merchantName',
      width: 150,
    },
    {
      title: '업종',
      dataIndex: 'merchantCategory',
      key: 'merchantCategory',
      width: 100,
    },
    {
      title: '금액',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
      sorter: true,
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
      ),
      filters: [
        { text: '승인', value: 'approved' },
        { text: '거절', value: 'rejected' },
        { text: '주의', value: 'flagged' },
        { text: '대기', value: 'pending' },
      ],
    },
    {
      title: '액션',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onViewDetail(record.id)}
          >
            상세
          </Button>
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
        showTotal: (total) => `총 ${total}건`,
        onChange: onPageChange,
      }}
      scroll={{ x: 1000 }}
      size="middle"
    />
  );
};
