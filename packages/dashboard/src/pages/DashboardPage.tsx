import React from 'react';
import { Row, Col, Typography, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard.api';
import { StatCard } from '@/components/dashboard/StatCard';
import { LiveFeed } from '@/components/dashboard/LiveFeed';
import { UsageChart } from '@/components/dashboard/UsageChart';
import { DepartmentChart } from '@/components/dashboard/DepartmentChart';
import { ViolationList } from '@/components/dashboard/ViolationList';
import { useDashboardStore } from '@/store/dashboardStore';
import { formatCurrency, formatPercent } from '@/utils/format';
import { getLastNDays } from '@/utils/date';

const { Title } = Typography;

export const DashboardPage: React.FC = () => {
  const { setRealtimeTransactions, setAlerts } = useDashboardStore();

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'realtime'],
    queryFn: async () => {
      const result = await dashboardApi.getRealtime();
      setRealtimeTransactions(result.recentTransactions);
      setAlerts(result.activeAlerts);
      return result;
    },
    refetchInterval: 30000,
  });

  const { startDate, endDate } = getLastNDays(30);

  const { data: dailyUsage = [], isLoading: dailyLoading } = useQuery({
    queryKey: ['dashboard', 'daily-usage', startDate, endDate],
    queryFn: () => dashboardApi.getDailyUsage(startDate, endDate),
  });

  const { data: departments = [], isLoading: deptLoading } = useQuery({
    queryKey: ['dashboard', 'departments'],
    queryFn: dashboardApi.getDepartmentUsage,
  });

  const { data: violations = [], isLoading: violationsLoading } = useQuery({
    queryKey: ['dashboard', 'violations'],
    queryFn: dashboardApi.getViolationSummary,
  });

  if (summaryLoading && !summary) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const today = summary?.todaySummary;
  const month = summary?.monthSummary;

  return (
    <div>
      <Title level={4} className="mb-4">대시보드</Title>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="금일 사용액"
            value={formatCurrency(today?.totalAmount ?? 0)}
            changePercent={15}
            changeLabel="전일 대비"
            loading={summaryLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="월 사용액"
            value={formatCurrency(month?.totalAmount ?? 0)}
            suffix={month ? `(${formatPercent(month.budgetUsage)})` : ''}
            loading={summaryLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="승인률"
            value={
              today && today.transactionCount > 0
                ? formatPercent(
                    (today.approvedCount / today.transactionCount) * 100
                  )
                : '0%'
            }
            changePercent={2.3}
            loading={summaryLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="위반 건수"
            value={`${today?.rejectedCount ?? 0}건`}
            changePercent={-3}
            changeLabel="전일 대비"
            loading={summaryLoading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} lg={14}>
          <LiveFeed />
        </Col>
        <Col xs={24} lg={10}>
          <DepartmentChart data={departments} loading={deptLoading} />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <UsageChart data={dailyUsage} loading={dailyLoading} />
        </Col>
        <Col xs={24} lg={10}>
          <ViolationList data={violations} loading={violationsLoading} />
        </Col>
      </Row>
    </div>
  );
};
