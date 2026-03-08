import React from 'react';
import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { Text, Card, Icon, Divider } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '../../api/transactions.api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Loading } from '../../components/common/Loading';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { colors } from '../../constants/colors';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TransactionStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<
  TransactionStackParamList,
  'TransactionDetail'
>;

const verTypeLabels: Record<string, string> = {
  location: '위치',
  category: '업종',
  region: '지역',
  limit: '한도',
  time: '시간',
};

const verResultConfig = {
  pass: { icon: 'check-circle', color: colors.success, label: '통과' },
  warning: { icon: 'alert-circle', color: colors.warning, label: '주의' },
  fail: { icon: 'close-circle', color: colors.error, label: '실패' },
};

export const TransactionDetailScreen: React.FC<Props> = ({ route }) => {
  const { transactionId } = route.params;

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => transactionsApi.getDetail(transactionId),
  });

  if (isLoading || !transaction) {
    return <Loading fullScreen message="상세 정보 로딩 중..." />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Status */}
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>상태</Text>
        <StatusBadge status={transaction.status} />
      </View>

      {/* Transaction Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>거래 정보</Text>
          <InfoRow label="상호명" value={transaction.merchantName} />
          <InfoRow
            label="금액"
            value={`${formatCurrency(transaction.amount)} (VAT ${formatCurrency(transaction.vat)})`}
          />
          <InfoRow
            label="일시"
            value={formatDateTime(transaction.transactionDate)}
          />
          <InfoRow label="업종" value={transaction.category} />
          {transaction.businessNumber && (
            <InfoRow
              label="사업자번호"
              value={transaction.businessNumber}
            />
          )}
        </Card.Content>
      </Card>

      {/* Receipt */}
      {transaction.receipt && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>영수증</Text>
            {transaction.receipt.fileUrl && (
              <Image
                source={{ uri: transaction.receipt.fileUrl }}
                style={styles.receiptImage}
                resizeMode="contain"
              />
            )}
            <InfoRow
              label="OCR 신뢰도"
              value={`${Math.round(transaction.receipt.ocrConfidence * 100)}%`}
            />
          </Card.Content>
        </Card>
      )}

      {/* Location */}
      {transaction.location && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>위치 정보</Text>
            <InfoRow
              label="업로드 위치"
              value={`${transaction.location.uploadGps.latitude.toFixed(4)}, ${transaction.location.uploadGps.longitude.toFixed(4)}`}
            />
            <InfoRow
              label="영수증 주소"
              value={transaction.location.receiptAddress}
            />
            <InfoRow
              label="거리 차이"
              value={`${Math.round(transaction.location.distance)}m`}
            />
          </Card.Content>
        </Card>
      )}

      {/* Verification Logs */}
      {transaction.verificationLogs && transaction.verificationLogs.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>검증 결과</Text>
            {transaction.verificationLogs.map((log, idx) => {
              const cfg = verResultConfig[log.result];
              return (
                <View key={idx}>
                  <View style={styles.verRow}>
                    <Icon source={cfg.icon} size={20} color={cfg.color} />
                    <Text style={styles.verType}>
                      {verTypeLabels[log.type] ?? log.type}
                    </Text>
                    <Text style={[styles.verResult, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>
                  <Text style={styles.verReason}>{log.reason}</Text>
                  {idx < transaction.verificationLogs.length - 1 && (
                    <Divider style={styles.divider} />
                  )}
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {/* Rejection Reason */}
      {transaction.rejectionReason && (
        <Card
          style={[
            styles.card,
            { borderLeftColor: colors.error, borderLeftWidth: 4 },
          ]}
        >
          <Card.Content>
            <Text style={styles.rejectionTitle}>거절 사유</Text>
            <Text style={styles.rejectionText}>
              {transaction.rejectionReason}
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={infoStyles.row}>
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={infoStyles.value}>{value}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: colors.border,
  },
  verRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  verResult: {
    fontSize: 14,
    fontWeight: '600',
  },
  verReason: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 28,
    marginTop: 2,
    marginBottom: 4,
  },
  divider: {
    marginVertical: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  bottomSpacer: {
    height: 32,
  },
});
