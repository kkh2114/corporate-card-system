import React, { useState } from 'react';
import { Form, Input, Button, Alert, Space } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { settingsApi } from '@/api/settings.api';

interface OcrStepProps {
  form: ReturnType<typeof Form.useForm>[0];
  onTestSuccess?: () => void;
}

export const OcrStep: React.FC<OcrStepProps> = ({ form, onTestSuccess }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      setTestResult(null);
      const result = await settingsApi.testConnection('ocr', { endpoint: values.api_url, apiKey: values.api_key });
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
      <Form form={form} layout="vertical">
        <Form.Item name="api_url" label="OCR API URL" rules={[{ required: true, message: 'API URL을 입력하세요' }]}>
          <Input placeholder="https://..." />
        </Form.Item>
        <Form.Item name="api_key" label="Secret Key" rules={[{ required: true, message: 'Secret Key를 입력하세요' }]}>
          <Input.Password />
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
