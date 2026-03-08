import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Alert, Space } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { settingsApi } from '@/api/settings.api';

interface DatabaseStepProps {
  form: ReturnType<typeof Form.useForm>[0];
  onTestSuccess?: () => void;
}

export const DatabaseStep: React.FC<DatabaseStepProps> = ({ form, onTestSuccess }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      setTestResult(null);
      const result = await settingsApi.testConnection('database', values);
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
      <Form form={form} layout="vertical" initialValues={{ host: 'localhost', port: 5432, database: 'corporate_card' }}>
        <Form.Item name="host" label="호스트" rules={[{ required: true, message: '호스트를 입력하세요' }]}>
          <Input placeholder="localhost" />
        </Form.Item>
        <Form.Item name="port" label="포트" rules={[{ required: true, message: '포트를 입력하세요' }]}>
          <InputNumber min={1} max={65535} className="w-full" />
        </Form.Item>
        <Form.Item name="username" label="사용자명" rules={[{ required: true, message: '사용자명을 입력하세요' }]}>
          <Input placeholder="postgres" />
        </Form.Item>
        <Form.Item name="password" label="비밀번호" rules={[{ required: true, message: '비밀번호를 입력하세요' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="database" label="데이터베이스명" rules={[{ required: true, message: '데이터베이스명을 입력하세요' }]}>
          <Input placeholder="corporate_card" />
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
