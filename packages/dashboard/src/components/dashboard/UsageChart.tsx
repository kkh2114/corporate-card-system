import React from 'react';
import { Card } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DailyUsage } from '@/types/models.types';
import { formatCurrency } from '@/utils/format';

interface UsageChartProps {
  data: DailyUsage[];
  loading?: boolean;
}

export const UsageChart: React.FC<UsageChartProps> = ({ data, loading }) => {
  return (
    <Card title="일별 사용 추이" loading={loading} className="h-full">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(val) => val.slice(5)}
          />
          <YAxis
            tickFormatter={(val) => `${(val / 10000).toFixed(0)}만`}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), '사용액']}
            labelFormatter={(label) => `날짜: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
