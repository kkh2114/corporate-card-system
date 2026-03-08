import React from 'react';
import { Card, List, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useDashboardStore } from '@/store/dashboardStore';
import { formatCurrency } from '@/utils/format';
import { formatDate } from '@/utils/format';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/config';
import type { Transaction } from '@/types/models.types';

const { Text } = Typography;

const statusIcons: Record<string, React.ReactNode> = {
  approved: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  rejected: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  flagged: <WarningOutlined style={{ color: '#faad14' }} />,
  pending: <WarningOutlined style={{ color: '#1890ff' }} />,
};

export const LiveFeed: React.FC = () => {
  const realtimeTransactions = useDashboardStore((s) => s.realtimeTransactions);

  const renderItem = (item: Transaction) => (
    <List.Item className="live-feed-item">
      <div className="flex justify-between items-start w-full">
        <div>
          <div className="flex items-center gap-2">
            <Text type="secondary" className="text-xs">
              [{formatDate(item.transactionDate, 'HH:mm')}]
            </Text>
            <Text strong>{item.employeeName}</Text>
            <Text type="secondary">({item.department})</Text>
          </div>
          <div className="ml-6 mt-1">
            <Text>{item.merchantName}</Text>
            <Text className="ml-2">{formatCurrency(item.amount)}</Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusIcons[item.status]}
          <Tag color={STATUS_COLORS[item.status]}>
            {STATUS_LABELS[item.status]}
          </Tag>
        </div>
      </div>
    </List.Item>
  );

  return (
    <Card
      title="실시간 거래 내역"
      className="h-full"
      extra={<Tag color="green">LIVE</Tag>}
    >
      <List
        dataSource={realtimeTransactions.slice(0, 10)}
        renderItem={renderItem}
        locale={{ emptyText: '실시간 거래 내역이 없습니다' }}
        size="small"
      />
    </Card>
  );
};
