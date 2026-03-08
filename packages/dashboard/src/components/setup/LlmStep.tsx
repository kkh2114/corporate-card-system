import React, { useState } from 'react';
import { Form, Input, Select, Button, Alert, Space } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { settingsApi } from '@/api/settings.api';

interface LlmStepProps {
  form: ReturnType<typeof Form.useForm>[0];
  onTestSuccess?: () => void;
}

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai', label: 'OpenAI (GPT)' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'custom', label: 'Custom (OpenAI Compatible)' },
];

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  google: 'gemini-2.0-flash',
  custom: '',
};

export const LlmStep: React.FC<LlmStepProps> = ({ form, onTestSuccess }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const selectedProvider = Form.useWatch('provider', form);

  const handleProviderChange = (provider: string) => {
    form.setFieldsValue({ model: DEFAULT_MODELS[provider] || '' });
  };

  const handleTest = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      setTestResult(null);
      const result = await settingsApi.testConnection('llm', values);
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
      <Form form={form} layout="vertical" initialValues={{ provider: 'anthropic', model: 'claude-sonnet-4-20250514' }}>
        <Form.Item name="provider" label="LLM 프로바이더" rules={[{ required: true }]}>
          <Select options={PROVIDERS} onChange={handleProviderChange} />
        </Form.Item>
        <Form.Item name="api_key" label="API Key" rules={[{ required: true, message: 'API Key를 입력하세요' }]}>
          <Input.Password placeholder="sk-..." />
        </Form.Item>
        <Form.Item name="model" label="모델" rules={[{ required: true, message: '모델을 입력하세요' }]}>
          <Input placeholder="모델 ID" />
        </Form.Item>
        {selectedProvider === 'custom' && (
          <Form.Item name="endpoint" label="API 엔드포인트" rules={[{ required: true, message: '엔드포인트를 입력하세요' }]}>
            <Input placeholder="https://api.example.com/v1" />
          </Form.Item>
        )}
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
