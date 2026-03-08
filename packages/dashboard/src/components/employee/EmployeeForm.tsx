import React, { useEffect } from 'react';
import { Form, Input, Select, InputNumber, Switch, Button, Space } from 'antd';
import type { Employee } from '@/types/models.types';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (values: Partial<Employee>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [form] = Form.useForm();
  const isEditing = !!employee;

  useEffect(() => {
    if (employee) {
      form.setFieldsValue(employee);
    } else {
      form.resetFields();
    }
  }, [employee, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{ isActive: true, role: 'employee', monthlyLimit: 2000000 }}
    >
      <Form.Item name="employeeId" label="사번" rules={[{ required: true, message: '사번을 입력하세요' }]}>
        <Input disabled={isEditing} />
      </Form.Item>
      <Form.Item name="name" label="이름" rules={[{ required: true, message: '이름을 입력하세요' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="email" label="이메일" rules={[{ required: true, type: 'email', message: '올바른 이메일을 입력하세요' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="phone" label="전화번호">
        <Input />
      </Form.Item>
      <Form.Item name="department" label="부서" rules={[{ required: true, message: '부서를 선택하세요' }]}>
        <Select>
          <Select.Option value="영업팀">영업팀</Select.Option>
          <Select.Option value="마케팅팀">마케팅팀</Select.Option>
          <Select.Option value="IT팀">IT팀</Select.Option>
          <Select.Option value="재무팀">재무팀</Select.Option>
          <Select.Option value="인사팀">인사팀</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="position" label="직급">
        <Select>
          <Select.Option value="사원">사원</Select.Option>
          <Select.Option value="대리">대리</Select.Option>
          <Select.Option value="과장">과장</Select.Option>
          <Select.Option value="차장">차장</Select.Option>
          <Select.Option value="부장">부장</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="role" label="역할" rules={[{ required: true }]}>
        <Select>
          <Select.Option value="employee">직원</Select.Option>
          <Select.Option value="manager">관리자</Select.Option>
          <Select.Option value="finance">재무</Select.Option>
          <Select.Option value="admin">시스템 관리자</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="monthlyLimit" label="월 한도 (원)">
        <InputNumber
          className="w-full"
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => Number(v!.replace(/,/g, ''))}
          min={0}
          step={100000}
        />
      </Form.Item>
      <Form.Item name="isActive" label="활성 상태" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditing ? '수정' : '등록'}
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
