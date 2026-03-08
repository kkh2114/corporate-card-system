import React, { useState } from 'react';
import { Form, Input, Button, Alert, Space } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { settingsApi } from '@/api/settings.api';

interface S3StepProps {
  form: ReturnType<typeof Form.useForm>[0];
  onTestSuccess?: () => void;
}

export const S3Step: React.FC<S3StepProps> = ({ form, onTestSuccess }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      setTestResult(null);
      const result = await settingsApi.testConnection('s3', values);
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
      <Form form={form} layout="vertical" initialValues={{ region: 'ap-northeast-2' }}>
        <Form.Item name="region" label="리전" rules={[{ required: true, message: '리전을 입력하세요' }]}>
          <Input placeholder="ap-northeast-2" />
        </Form.Item>
        <Form.Item name="endpoint" label="엔드포인트 (LocalStack 등)">
          <Input placeholder="http://localhost:4566 (선택사항)" />
        </Form.Item>
        <Form.Item name="accessKeyId" label="Access Key ID" rules={[{ required: true, message: 'Access Key를 입력하세요' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="secretAccessKey" label="Secret Access Key" rules={[{ required: true, message: 'Secret Key를 입력하세요' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="bucket" label="버킷명" rules={[{ required: true, message: '버킷명을 입력하세요' }]}>
          <Input placeholder="corporate-card-receipts" />
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
