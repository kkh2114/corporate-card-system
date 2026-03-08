import React from 'react';
import { Descriptions, Tag, Button, Space, Card, Divider } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { Transaction } from '@/types/models.types';
import { formatCurrency, formatDate } from '@/utils/format';
import { STATUS_COLORS, STATUS_LABELS } from '@/constants/config';

interface TransactionDetailProps {
  transaction: Transaction;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onFlag: (id: string) => void;
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({
  transaction,
  onApprove,
  onReject,
  onFlag,
}) => {
  const verification = transaction.verificationResult;

  return (
    <div>
      <Descriptions title="직원 정보" bordered column={2}>
        <Descriptions.Item label="직원명">
          {transaction.employeeName}
        </Descriptions.Item>
        <Descriptions.Item label="부서">
          {transaction.department}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Descriptions title="거래 정보" bordered column={2}>
        <Descriptions.Item label="가맹점">
          {transaction.merchantName}
        </Descriptions.Item>
        <Descriptions.Item label="업종">
          {transaction.merchantCategory}
        </Descriptions.Item>
        <Descriptions.Item label="금액">
          {formatCurrency(transaction.amount)}
        </Descriptions.Item>
        <Descriptions.Item label="거래일시">
          {formatDate(transaction.transactionDate)}
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <Tag color={STATUS_COLORS[transaction.status]}>
            {STATUS_LABELS[transaction.status]}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {transaction.location && (
        <>
          <Divider />
          <Descriptions title="위치 정보" bordered column={1}>
            <Descriptions.Item label="주소">
              {transaction.location.address}
            </Descriptions.Item>
            <Descriptions.Item label="좌표">
              {transaction.location.latitude}, {transaction.location.longitude}
            </Descriptions.Item>
          </Descriptions>
        </>
      )}

      {verification && (
        <>
          <Divider />
          <Card title="검증 결과" size="small">
            <Space direction="vertical" className="w-full">
              <div className="flex items-center gap-2">
                {verification.categoryAllowed ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )}
                <span>업종: {verification.categoryAllowed ? '허용됨' : '제한됨'}</span>
              </div>
              <div className="flex items-center gap-2">
                {verification.locationMatch ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <WarningOutlined style={{ color: '#faad14' }} />
                )}
                <span>위치: {verification.locationDistance}m 이격</span>
              </div>
              <div className="flex items-center gap-2">
                {verification.withinLimit ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )}
                <span>한도: {verification.withinLimit ? '범위 내' : '초과'}</span>
              </div>
              <div className="flex items-center gap-2">
                {verification.regionAllowed ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )}
                <span>지역: {verification.regionAllowed ? '허용' : '제한'}</span>
              </div>
            </Space>
          </Card>
        </>
      )}

      {transaction.status === 'flagged' || transaction.status === 'pending' ? (
        <>
          <Divider />
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => onApprove(transaction.id)}
            >
              승인
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => onReject(transaction.id)}
            >
              거절
            </Button>
            <Button
              icon={<WarningOutlined />}
              onClick={() => onFlag(transaction.id)}
            >
              플래그 지정
            </Button>
          </Space>
        </>
      ) : null}
    </div>
  );
};
