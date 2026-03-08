import React from 'react';
import { Card, List, Tag } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import type { ViolationSummary } from '@/types/models.types';

interface ViolationListProps {
  data: ViolationSummary[];
  loading?: boolean;
}

const violationColors: Record<string, string> = {
  location_mismatch: 'orange',
  restricted_category: 'red',
  region_violation: 'volcano',
  limit_exceeded: 'magenta',
};

export const ViolationList: React.FC<ViolationListProps> = ({
  data,
  loading,
}) => {
  return (
    <Card title="위반 현황" loading={loading} className="h-full">
      <List
        dataSource={data}
        renderItem={(item) => (
          <List.Item>
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-2">
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>{item.label}</span>
              </div>
              <Tag color={violationColors[item.type] || 'default'}>
                {item.count}건
              </Tag>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: '위반 내역이 없습니다' }}
      />
    </Card>
  );
};
