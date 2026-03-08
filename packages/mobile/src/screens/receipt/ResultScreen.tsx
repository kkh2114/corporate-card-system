import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Card, Icon, TextInput } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/format';
import { transactionsApi } from '../../api/transactions.api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ReceiptStackParamList } from '../../types/navigation.types';
import type { VerificationResult } from '../../types/models.types';

type Props = NativeStackScreenProps<ReceiptStackParamList, 'Result'>;

const statusConfig = {
  approved: {
    icon: 'check-circle' as const,
    color: colors.success,
    title: '영수증이 승인되었습니다',
  },
  rejected: {
    icon: 'close-circle' as const,
    color: colors.error,
    title: '영수증이 거절되었습니다',
  },
  flagged: {
    icon: 'alert-circle' as const,
    color: colors.warning,
    title: '추가 확인이 필요합니다',
  },
};

const verificationLabels: Record<string, string> = {
  location: '위치 검증',
  category: '업종 검증',
  region: '지역 검증',
  limit: '한도 검증',
  time: '시간 검증',
};

export const ResultScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    transactionId,
    status,
    message,
    rejectionReason,
    verificationResults: verResultsStr,
    amount,
    merchantName,
    category,
  } = route.params;

  const config = statusConfig[status];
  const verResults: VerificationResult | null = verResultsStr
    ? JSON.parse(verResultsStr)
    : null;

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitReason = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await transactionsApi.submitReason(transactionId, reason);
      setSubmitted(true);
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    navigation.getParent()?.navigate('HomeTab');
  };

  const goUpload = () => {
    navigation.popToTop();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statusSection}>
        <Icon source={config.icon} size={64} color={config.color} />
        <Text style={[styles.statusTitle, { color: config.color }]}>
          {config.title}
        </Text>
      </View>

      {/* Transaction Summary */}
      {merchantName && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.label}>상호</Text>
              <Text style={styles.value}>{merchantName}</Text>
            </View>
            {amount != null && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>금액</Text>
                <Text style={styles.value}>{formatCurrency(amount)}</Text>
              </View>
            )}
            {category && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>업종</Text>
                <Text style={styles.value}>{category}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Rejection Reason */}
      {status === 'rejected' && rejectionReason && (
        <Card style={[styles.card, { borderLeftColor: colors.error, borderLeftWidth: 4 }]}>
          <Card.Content>
            <Text style={styles.rejectionLabel}>거절 사유</Text>
            <Text style={styles.rejectionText}>{rejectionReason}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Verification Results */}
      {verResults && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>검증 결과</Text>
            {Object.entries(verResults).map(([key, result]) => {
              const resultStatus = (result as { status: string }).status;
              const resultMessage = (result as { message: string }).message;
              const iconName =
                resultStatus === 'pass'
                  ? 'check-circle'
                  : resultStatus === 'warning'
                    ? 'alert-circle'
                    : 'close-circle';
              const iconColor =
                resultStatus === 'pass'
                  ? colors.success
                  : resultStatus === 'warning'
                    ? colors.warning
                    : colors.error;

              return (
                <View key={key} style={styles.verRow}>
                  <Icon source={iconName} size={20} color={iconColor} />
                  <Text style={styles.verLabel}>
                    {verificationLabels[key] ?? key}
                  </Text>
                  <Text style={styles.verMessage}>{resultMessage}</Text>
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {/* Status Message */}
      {message && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>상세 안내</Text>
            <Text style={styles.messageText}>{message}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Remaining Limits (approved) */}
      {status === 'approved' && verResults?.limit && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>잔여 한도</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>일일</Text>
              <Text style={styles.value}>
                {formatCurrency(verResults.limit.remainingDaily)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>월간</Text>
              <Text style={styles.value}>
                {formatCurrency(verResults.limit.remainingMonthly)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Location Distance Warning */}
      {verResults?.location && verResults.location.status !== 'pass' && (
        <Card style={[styles.card, { borderLeftColor: colors.warning, borderLeftWidth: 4 }]}>
          <Card.Content>
            <Text style={styles.cardTitle}>위치 검증 상세</Text>
            <Text style={styles.messageText}>{verResults.location.message}</Text>
            <Text style={styles.distanceText}>
              거리 차이: {verResults.location.distance}m
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Reason Input (flagged) */}
      {status === 'flagged' && !submitted && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>사유를 입력해주세요</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="위치가 다른 사유를 입력해주세요"
              style={styles.reasonInput}
            />
            <Button
              mode="contained"
              onPress={handleSubmitReason}
              loading={submitting}
              disabled={!reason.trim() || submitting}
              style={styles.reasonButton}
            >
              사유 제출
            </Button>
          </Card.Content>
        </Card>
      )}

      {submitted && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.submittedText}>
              사유가 제출되었습니다. 관리자 검토 후 결과를 알려드립니다.
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {status === 'rejected' && (
          <Button
            mode="outlined"
            onPress={goUpload}
            style={styles.actionButton}
          >
            다시 업로드하기
          </Button>
        )}
        <Button
          mode="contained"
          onPress={goHome}
          style={styles.actionButton}
        >
          홈으로 이동
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statusSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  verRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  verLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    minWidth: 70,
  },
  verMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  distanceText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  reasonInput: {
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  reasonButton: {
    borderRadius: 8,
  },
  submittedText: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
});
