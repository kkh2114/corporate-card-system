import React from 'react';
import { Form, Input, Select, DatePicker, Button, Space, InputNumber } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TransactionFilterParams } from '@/types/api.types';

const { RangePicker } = DatePicker;

interface TransactionFilterProps {
  onFilter: (values: TransactionFilterParams) => void;
  onReset: () => void;
}

export const TransactionFilter: React.FC<TransactionFilterProps> = ({
  onFilter,
  onReset,
}) => {
  const [form] = Form.useForm();

  const handleFinish = (values: Record<string, unknown>) => {
    const dateRange = values.dateRange as [{ format: (f: string) => string }, { format: (f: string) => string }] | undefined;
    const params: TransactionFilterParams = {
      search: values.search as string,
      status: values.status as string,
      department: values.department as string,
      minAmount: values.minAmount as number,
      maxAmount: values.maxAmount as number,
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
    };
    onFilter(params);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Form form={form} layout="inline" onFinish={handleFinish} className="mb-4 flex-wrap gap-y-2">
      <Form.Item name="search">
        <Input placeholder="직원명 / 가맹점 검색" prefix={<SearchOutlined />} allowClear />
      </Form.Item>
      <Form.Item name="status">
        <Select placeholder="상태" allowClear style={{ width: 120 }}>
          <Select.Option value="approved">승인</Select.Option>
          <Select.Option value="rejected">거절</Select.Option>
          <Select.Option value="flagged">주의</Select.Option>
          <Select.Option value="pending">대기</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="department">
        <Select placeholder="부서" allowClear style={{ width: 120 }}>
          <Select.Option value="영업팀">영업팀</Select.Option>
          <Select.Option value="마케팅팀">마케팅팀</Select.Option>
          <Select.Option value="IT팀">IT팀</Select.Option>
          <Select.Option value="재무팀">재무팀</Select.Option>
          <Select.Option value="인사팀">인사팀</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="dateRange">
        <RangePicker />
      </Form.Item>
      <Form.Item name="minAmount">
        <InputNumber placeholder="최소 금액" style={{ width: 120 }} />
      </Form.Item>
      <Form.Item name="maxAmount">
        <InputNumber placeholder="최대 금액" style={{ width: 120 }} />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
            검색
          </Button>
          <Button onClick={handleReset} icon={<ReloadOutlined />}>
            초기화
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
