import React, { useState } from 'react';
import { Steps, Button, Card, Typography, message, Space, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { DatabaseStep } from '@/components/setup/DatabaseStep';
import { RedisStep } from '@/components/setup/RedisStep';
import { S3Step } from '@/components/setup/S3Step';
import { OcrStep } from '@/components/setup/OcrStep';
import { LlmStep } from '@/components/setup/LlmStep';
import { settingsApi } from '@/api/settings.api';
import { Form } from 'antd';
import { ROUTES } from '@/constants/routes';

const { Title, Text } = Typography;

const STEPS = [
  { title: 'Database', description: 'PostgreSQL 연결' },
  { title: 'Redis', description: 'Redis 연결' },
  { title: 'S3', description: '파일 스토리지' },
  { title: 'OCR', description: 'CLOVA OCR' },
  { title: 'LLM', description: 'AI 프로바이더' },
];

const CATEGORIES = ['database', 'redis', 's3', 'ocr', 'llm'];

const SENSITIVE_KEYS = ['password', 'api_key', 'secret_access_key', 'secretAccessKey'];

export const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [dbForm] = Form.useForm();
  const [redisForm] = Form.useForm();
  const [s3Form] = Form.useForm();
  const [ocrForm] = Form.useForm();
  const [llmForm] = Form.useForm();

  const forms = [dbForm, redisForm, s3Form, ocrForm, llmForm];

  const saveCurrentStep = async () => {
    const form = forms[currentStep];
    try {
      const values = await form.validateFields();
      setSaving(true);
      const category = CATEGORIES[currentStep];
      const settings = Object.entries(values)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([key, value]) => ({
          key,
          value: String(value),
          isEncrypted: SENSITIVE_KEYS.includes(key),
        }));
      await settingsApi.updateByCategory(category, settings);
      return true;
    } catch (error: any) {
      message.error(error?.response?.data?.message || '설정 저장에 실패했습니다.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const saved = await saveCurrentStep();
    if (saved) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setCompleted(true);
        message.success('초기 설정이 완료되었습니다!');
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-[600px]">
          <Result
            status="success"
            title="초기 설정 완료"
            subTitle="모든 서비스 연결이 설정되었습니다. 대시보드로 이동합니다."
            extra={[
              <Button type="primary" key="dashboard" onClick={() => navigate(ROUTES.DASHBOARD)}>
                대시보드로 이동
              </Button>,
            ]}
          />
        </Card>
      </div>
    );
  }

  const stepContent = [
    <DatabaseStep key="db" form={dbForm} />,
    <RedisStep key="redis" form={redisForm} />,
    <S3Step key="s3" form={s3Form} />,
    <OcrStep key="ocr" form={ocrForm} />,
    <LlmStep key="llm" form={llmForm} />,
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Title level={3}>시스템 초기 설정</Title>
          <Text type="secondary">법인카드 관리 시스템에 필요한 외부 서비스를 설정합니다.</Text>
        </div>

        <Card className="mb-6">
          <Steps current={currentStep} items={STEPS} size="small" className="mb-8" />
          <div className="min-h-[300px]">
            {stepContent[currentStep]}
          </div>
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button disabled={currentStep === 0} onClick={handlePrev}>
              이전
            </Button>
            <Space>
              <Button type="primary" onClick={handleNext} loading={saving}>
                {currentStep === STEPS.length - 1 ? '완료' : '저장 후 다음'}
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
};
