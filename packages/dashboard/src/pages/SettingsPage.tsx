import React, { useEffect, useState } from 'react';
import { Typography, Card, Form, Input, InputNumber, Switch, Button, Divider, Tabs, Tag, Space, Spin, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { DatabaseStep } from '@/components/setup/DatabaseStep';
import { RedisStep } from '@/components/setup/RedisStep';
import { S3Step } from '@/components/setup/S3Step';
import { OcrStep } from '@/components/setup/OcrStep';
import { LlmStep } from '@/components/setup/LlmStep';
import { settingsApi, type ConnectionStatus } from '@/api/settings.api';

const { Title } = Typography;

const SENSITIVE_KEYS = ['password', 'api_key', 'secret_access_key', 'secretAccessKey'];

const StatusTag: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  if (!status.configured) return <Tag icon={<MinusCircleOutlined />} color="default">미설정</Tag>;
  if (status.connected) return <Tag icon={<CheckCircleOutlined />} color="success">연결됨</Tag>;
  if (status.connected === false) return <Tag icon={<CloseCircleOutlined />} color="error">연결 실패</Tag>;
  return <Tag color="processing">확인 중</Tag>;
};

const ExternalServicesTab: React.FC = () => {
  const [dbForm] = Form.useForm();
  const [redisForm] = Form.useForm();
  const [s3Form] = Form.useForm();
  const [ocrForm] = Form.useForm();
  const [statuses, setStatuses] = useState<ConnectionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusList, dbSettings, redisSettings, s3Settings, ocrSettings] = await Promise.all([
        settingsApi.getStatus(),
        settingsApi.getByCategory('database').catch(() => []),
        settingsApi.getByCategory('redis').catch(() => []),
        settingsApi.getByCategory('s3').catch(() => []),
        settingsApi.getByCategory('ocr').catch(() => []),
      ]);
      setStatuses(statusList);
      const toObj = (items: Array<{ key: string; value: string }>) =>
        Object.fromEntries(items.map((i) => [i.key, i.value]));
      if (dbSettings.length) dbForm.setFieldsValue(toObj(dbSettings));
      if (redisSettings.length) redisForm.setFieldsValue(toObj(redisSettings));
      if (s3Settings.length) s3Form.setFieldsValue(toObj(s3Settings));
      if (ocrSettings.length) ocrForm.setFieldsValue(toObj(ocrSettings));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category: string, form: ReturnType<typeof Form.useForm>[0]) => {
    try {
      const values = await form.validateFields();
      setSavingCategory(category);
      const settings = Object.entries(values)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([key, value]) => ({
          key,
          value: String(value),
          isEncrypted: SENSITIVE_KEYS.includes(key),
        }));
      await settingsApi.updateByCategory(category, settings);
      message.success(`${category} 설정이 저장되었습니다.`);
      loadData();
    } catch {
      message.error('설정 저장에 실패했습니다.');
    } finally {
      setSavingCategory(null);
    }
  };

  const getStatus = (cat: string) => statuses.find((s) => s.category === cat);

  if (loading) return <Spin className="block mt-8 mx-auto" />;

  return (
    <div className="space-y-6">
      <Card title={<Space>Database (PostgreSQL) {getStatus('database') && <StatusTag status={getStatus('database')!} />}</Space>}>
        <DatabaseStep form={dbForm} />
        <Divider />
        <Button type="primary" loading={savingCategory === 'database'} onClick={() => handleSave('database', dbForm)}>저장</Button>
      </Card>
      <Card title={<Space>Redis {getStatus('redis') && <StatusTag status={getStatus('redis')!} />}</Space>}>
        <RedisStep form={redisForm} />
        <Divider />
        <Button type="primary" loading={savingCategory === 'redis'} onClick={() => handleSave('redis', redisForm)}>저장</Button>
      </Card>
      <Card title={<Space>S3 스토리지 {getStatus('s3') && <StatusTag status={getStatus('s3')!} />}</Space>}>
        <S3Step form={s3Form} />
        <Divider />
        <Button type="primary" loading={savingCategory === 's3'} onClick={() => handleSave('s3', s3Form)}>저장</Button>
      </Card>
      <Card title={<Space>OCR (CLOVA) {getStatus('ocr') && <StatusTag status={getStatus('ocr')!} />}</Space>}>
        <OcrStep form={ocrForm} />
        <Divider />
        <Button type="primary" loading={savingCategory === 'ocr'} onClick={() => handleSave('ocr', ocrForm)}>저장</Button>
      </Card>
    </div>
  );
};

const LlmSettingsTab: React.FC = () => {
  const [llmForm] = Form.useForm();
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusList, llmSettings] = await Promise.all([
        settingsApi.getStatus(),
        settingsApi.getByCategory('llm').catch(() => []),
      ]);
      setStatus(statusList.find((s) => s.category === 'llm') || null);
      if (llmSettings.length) {
        const obj = Object.fromEntries(llmSettings.map((i) => [i.key, i.value]));
        llmForm.setFieldsValue(obj);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await llmForm.validateFields();
      setSaving(true);
      const settings = Object.entries(values)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([key, value]) => ({
          key,
          value: String(value),
          isEncrypted: SENSITIVE_KEYS.includes(key),
        }));
      await settingsApi.updateByCategory('llm', settings);
      message.success('LLM 설정이 저장되었습니다.');
      loadData();
    } catch {
      message.error('설정 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin className="block mt-8 mx-auto" />;

  return (
    <Card title={<Space>LLM 프로바이더 {status && <StatusTag status={status} />}</Space>}>
      <LlmStep form={llmForm} />
      <Divider />
      <Button type="primary" loading={saving} onClick={handleSave}>저장</Button>
    </Card>
  );
};

export const SettingsPage: React.FC = () => {
  const [generalForm] = Form.useForm();
  const [notificationForm] = Form.useForm();

  const tabItems = [
    {
      key: 'general',
      label: '일반 설정',
      children: (
        <Card>
          <Form
            form={generalForm}
            layout="vertical"
            initialValues={{
              locationThreshold: 500,
              highAmountThreshold: 500000,
              autoApprove: true,
              defaultMonthlyLimit: 2000000,
            }}
          >
            <Form.Item name="locationThreshold" label="위치 허용 오차 (m)">
              <InputNumber min={100} max={5000} step={100} className="w-full" />
            </Form.Item>
            <Form.Item name="highAmountThreshold" label="고액 거래 기준 (원)">
              <InputNumber
                min={100000}
                step={100000}
                className="w-full"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number(v!.replace(/,/g, ''))}
              />
            </Form.Item>
            <Form.Item name="defaultMonthlyLimit" label="기본 월 한도 (원)">
              <InputNumber
                min={0}
                step={100000}
                className="w-full"
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number(v!.replace(/,/g, ''))}
              />
            </Form.Item>
            <Form.Item name="autoApprove" label="자동 승인 (정상 거래)" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Divider />
            <Button type="primary">저장</Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'notifications',
      label: '알림 설정',
      children: (
        <Card>
          <Form
            form={notificationForm}
            layout="vertical"
            initialValues={{
              emailNotification: true,
              smsNotification: false,
              pushNotification: true,
              alertEmail: '',
            }}
          >
            <Form.Item name="emailNotification" label="이메일 알림" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="smsNotification" label="SMS 알림" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="pushNotification" label="푸시 알림" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item
              name="alertEmail"
              label="알림 수신 이메일"
              rules={[{ type: 'email', message: '올바른 이메일을 입력하세요' }]}
            >
              <Input placeholder="admin@company.com" />
            </Form.Item>
            <Divider />
            <Button type="primary">저장</Button>
          </Form>
        </Card>
      ),
    },
    {
      key: 'external-services',
      label: '외부 서비스',
      children: <ExternalServicesTab />,
    },
    {
      key: 'llm',
      label: 'LLM 설정',
      children: <LlmSettingsTab />,
    },
  ];

  return (
    <div>
      <Title level={4} className="mb-4">설정</Title>
      <Tabs items={tabItems} />
    </div>
  );
};
