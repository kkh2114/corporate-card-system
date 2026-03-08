import React from 'react';
import { Descriptions, Tag, Table, Card } from 'antd';
import type { CardPolicy, PolicyRule } from '@/types/models.types';
import { formatDate } from '@/utils/format';

interface PolicyDetailProps {
  policy: CardPolicy;
}

const ruleTypeLabels: Record<string, string> = {
  category: '업종',
  region: '지역',
  time: '시간',
  amount: '금액',
  merchant: '가맹점',
};

const actionLabels: Record<string, { label: string; color: string }> = {
  deny: { label: '차단', color: 'red' },
  flag: { label: '주의', color: 'orange' },
  allow: { label: '허용', color: 'green' },
};

export const PolicyDetail: React.FC<PolicyDetailProps> = ({ policy }) => {
  const ruleColumns = [
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => ruleTypeLabels[type] || type,
    },
    {
      title: '조건',
      dataIndex: 'condition',
      key: 'condition',
    },
    {
      title: '값',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: '처리',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const info = actionLabels[action];
        return info ? <Tag color={info.color}>{info.label}</Tag> : action;
      },
    },
  ];

  return (
    <div>
      <Descriptions title="정책 정보" bordered column={2}>
        <Descriptions.Item label="정책명">{policy.name}</Descriptions.Item>
        <Descriptions.Item label="상태">
          <Tag color={policy.isActive ? 'green' : 'default'}>
            {policy.isActive ? '활성' : '비활성'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="설명" span={2}>
          {policy.description}
        </Descriptions.Item>
        <Descriptions.Item label="적용 부서" span={2}>
          {policy.appliedDepartments.map((d) => (
            <Tag key={d}>{d}</Tag>
          ))}
        </Descriptions.Item>
        <Descriptions.Item label="생성일">
          {formatDate(policy.createdAt, 'YYYY-MM-DD')}
        </Descriptions.Item>
        <Descriptions.Item label="수정일">
          {formatDate(policy.updatedAt, 'YYYY-MM-DD')}
        </Descriptions.Item>
      </Descriptions>

      <Card title={`규칙 목록 (${policy.rules.length}개)`} className="mt-4">
        <Table<PolicyRule>
          columns={ruleColumns}
          dataSource={policy.rules}
          rowKey={(_, index) => String(index)}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};
