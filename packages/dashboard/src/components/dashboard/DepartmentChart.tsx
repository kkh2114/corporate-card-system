import React from 'react';
import { Card, Progress, Space, Typography } from 'antd';
import type { DepartmentUsage } from '@/types/models.types';
import { formatCurrency } from '@/utils/format';

const { Text } = Typography;

interface DepartmentChartProps {
  data: DepartmentUsage[];
  loading?: boolean;
}

export const DepartmentChart: React.FC<DepartmentChartProps> = ({
  data,
  loading,
}) => {
  return (
    <Card title="부서별 사용 현황" loading={loading} className="h-full">
      <Space direction="vertical" className="w-full" size="middle">
        {data.map((dept) => (
          <div key={dept.department}>
            <div className="flex justify-between mb-1">
              <Text>{dept.department}</Text>
              <Text type="secondary">
                {formatCurrency(dept.totalAmount)} / {formatCurrency(dept.budgetLimit)}
              </Text>
            </div>
            <Progress
              percent={dept.usagePercent}
              strokeColor={dept.usagePercent > 80 ? '#ff4d4f' : '#2563eb'}
              size="small"
            />
          </div>
        ))}
      </Space>
    </Card>
  );
};
