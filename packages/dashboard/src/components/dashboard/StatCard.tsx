import React from 'react';
import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface StatCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  changePercent?: number;
  changeLabel?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  prefix,
  suffix,
  changePercent,
  changeLabel,
  loading,
}) => {
  const isPositive = changePercent !== undefined && changePercent >= 0;

  return (
    <Card loading={loading} className="h-full">
      <Statistic title={title} value={value} prefix={prefix} suffix={suffix} />
      {changePercent !== undefined && (
        <div className={`mt-2 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          <span className="ml-1">
            {Math.abs(changePercent).toFixed(1)}%
          </span>
          {changeLabel && <span className="text-gray-400 ml-1">{changeLabel}</span>}
        </div>
      )}
    </Card>
  );
};
