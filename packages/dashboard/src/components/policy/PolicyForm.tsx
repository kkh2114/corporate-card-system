import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Space, Card } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import type { CardPolicy } from '@/types/models.types';

const { TextArea } = Input;

interface PolicyFormProps {
  policy?: CardPolicy | null;
  onSubmit: (values: Partial<CardPolicy>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const PolicyForm: React.FC<PolicyFormProps> = ({
  policy,
  onSubmit,
  onCancel,
  loading,
}) => {
  const [form] = Form.useForm();
  const isEditing = !!policy;

  useEffect(() => {
    if (policy) {
      form.setFieldsValue(policy);
    } else {
      form.resetFields();
    }
  }, [policy, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={{ rules: [], appliedDepartments: [] }}
    >
      <Form.Item name="name" label="정책명" rules={[{ required: true, message: '정책명을 입력하세요' }]}>
        <Input placeholder="예: 유흥업소 결제 차단" />
      </Form.Item>
      <Form.Item name="description" label="설명">
        <TextArea rows={3} placeholder="정책 설명을 입력하세요" />
      </Form.Item>
      <Form.Item name="appliedDepartments" label="적용 부서">
        <Select mode="multiple" placeholder="적용할 부서를 선택하세요">
          <Select.Option value="영업팀">영업팀</Select.Option>
          <Select.Option value="마케팅팀">마케팅팀</Select.Option>
          <Select.Option value="IT팀">IT팀</Select.Option>
          <Select.Option value="재무팀">재무팀</Select.Option>
          <Select.Option value="인사팀">인사팀</Select.Option>
        </Select>
      </Form.Item>

      <Card title="규칙 목록" size="small" className="mb-4">
        <Form.List name="rules">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className="flex gap-2 mb-2 items-start">
                  <Form.Item {...restField} name={[name, 'type']} className="mb-0 flex-1" rules={[{ required: true }]}>
                    <Select placeholder="유형">
                      <Select.Option value="category">업종</Select.Option>
                      <Select.Option value="region">지역</Select.Option>
                      <Select.Option value="time">시간</Select.Option>
                      <Select.Option value="amount">금액</Select.Option>
                      <Select.Option value="merchant">가맹점</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'condition']} className="mb-0 flex-1" rules={[{ required: true }]}>
                    <Input placeholder="조건 (예: equals, greaterThan)" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'value']} className="mb-0 flex-1" rules={[{ required: true }]}>
                    <Input placeholder="값 (예: 유흥업소, 500000)" />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'action']} className="mb-0 w-24" rules={[{ required: true }]}>
                    <Select placeholder="처리">
                      <Select.Option value="deny">차단</Select.Option>
                      <Select.Option value="flag">주의</Select.Option>
                      <Select.Option value="allow">허용</Select.Option>
                    </Select>
                  </Form.Item>
                  <MinusCircleOutlined
                    className="mt-2 text-red-500 cursor-pointer"
                    onClick={() => remove(name)}
                  />
                </div>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                규칙 추가
              </Button>
            </>
          )}
        </Form.List>
      </Card>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            {isEditing ? '수정' : '생성'}
          </Button>
          <Button onClick={onCancel}>취소</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};
