import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Alert, Space } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { settingsApi } from '@/api/settings.api';

interface RedisStepProps {
  form: ReturnType<typeof Form.useForm>[0];
  onTestSuccess?: () => void;
}

export const RedisStep: React.FC<RedisStepProps> = ({ form, onTestSuccess }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      setTestResult(null);
      const result = await settingsApi.testConnection('redis', values);
      setTestResult(result);
      if (result.success) onTestSuccess?.();
    } catch {
      setTestResult({ success: false, message: '입력값을 확인해주세요.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical" initialValues={{ host: 'localhost', port: 6379 }}>
        <Form.Item name="host" label="호스트" rules={[{ required: true, message: '호스트를 입력하세요' }]}>
          <Input placeholder="localhost" />
        </Form.Item>
        <Form.Item name="port" label="포트" rules={[{ required: true, message: '포트를 입력하세요' }]}>
          <InputNumber min={1} max={65535} className="w-full" />
        </Form.Item>
        <Form.Item name="password" label="비밀번호 (선택사항)">
          <Input.Password placeholder="비밀번호 없으면 비워두세요" />
        </Form.Item>
      </Form>
      <Space direction="vertical" className="w-full">
        <Button type="primary" onClick={handleTest} loading={testing} icon={testing ? <LoadingOutlined /> : <CheckCircleOutlined />}>
          연결 테스트
        </Button>
        {testResult && (
          <Alert type={testResult.success ? 'success' : 'error'} message={testResult.message} showIcon />
        )}
      </Space>
    </div>
  );
};
