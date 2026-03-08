import React, { useState } from 'react';
import { Typography, Row, Col, Card, DatePicker, Select, Space, Statistic } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { statisticsApi } from '@/api/statistics.api';
import { formatCurrency } from '@/utils/format';
import { getLastNDays } from '@/utils/date';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const StatisticsPage: React.FC = () => {
  const defaultRange = getLastNDays(30);
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(defaultRange);
  const [department, setDepartment] = useState<string | undefined>();

  const params = { ...dateRange, department };

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['statistics', 'overview', params],
    queryFn: () => statisticsApi.getOverview(params),
  });

  const { data: dailyTrend = [] } = useQuery({
    queryKey: ['statistics', 'daily-trend', params],
    queryFn: () => statisticsApi.getDailyTrend(params),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['statistics', 'departments', params],
    queryFn: () => statisticsApi.getDepartmentComparison(params),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['statistics', 'categories', params],
    queryFn: () => statisticsApi.getCategoryAnalysis(params),
  });

  const handleDateChange = (_: unknown, dateStrings: [string, string]) => {
    if (dateStrings[0] && dateStrings[1]) {
      setDateRange({ startDate: dateStrings[0], endDate: dateStrings[1] });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="mb-0">통계 / 리포트</Title>
        <Space>
          <Select
            placeholder="부서"
            allowClear
            style={{ width: 150 }}
            value={department}
            onChange={setDepartment}
          >
            <Select.Option value="영업팀">영업팀</Select.Option>
            <Select.Option value="마케팅팀">마케팅팀</Select.Option>
            <Select.Option value="IT팀">IT팀</Select.Option>
            <Select.Option value="재무팀">재무팀</Select.Option>
            <Select.Option value="인사팀">인사팀</Select.Option>
          </Select>
          <RangePicker
            defaultValue={[dayjs(defaultRange.startDate), dayjs(defaultRange.endDate)]}
            onChange={handleDateChange}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={8}>
          <Card loading={overviewLoading}>
            <Statistic
              title="총 사용액"
              value={overview?.totalAmount ?? 0}
              formatter={(v) => formatCurrency(Number(v))}
            />
            {overview?.comparedToPrevious && (
              <div className={`text-sm mt-1 ${overview.comparedToPrevious.amountChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                {overview.comparedToPrevious.amountChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {' '}{Math.abs(overview.comparedToPrevious.amountChange).toFixed(1)}% 전기 대비
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={overviewLoading}>
            <Statistic title="총 거래 건수" value={overview?.totalTransactions ?? 0} suffix="건" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={overviewLoading}>
            <Statistic
              title="승인률"
              value={overview?.approvalRate ?? 0}
              precision={1}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} lg={14}>
          <Card title="일별 사용 추이">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(v) => v.slice(5)} />
                <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), '사용액']} />
                <Legend />
                <Line type="monotone" dataKey="amount" name="사용액" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="카테고리별 지출 분포">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="amount"
                  nameKey="category"
                  label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`}
                >
                  {categories.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="부서별 사용 비교">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="totalAmount" name="사용액" fill="#2563eb" />
                <Bar dataKey="budgetLimit" name="예산" fill="#e5e7eb" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
