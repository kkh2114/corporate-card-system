import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, ProgressBar, Icon, Button } from 'react-native-paper';
import { io, Socket } from 'socket.io-client';
import { useReceiptStore } from '../../store/receiptStore';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { Config } from '../../constants/config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ReceiptStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<ReceiptStackParamList, 'Processing'>;

export const ProcessingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId, websocketChannel } = route.params;
  const { processingSteps, updateProcessingStep } = useReceiptStore();
  const socketRef = useRef<Socket | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);

  const completedCount = processingSteps.filter((s) => s.completed).length;
  const progress = completedCount / processingSteps.length;

  useEffect(() => {
    // Connect via Socket.IO to match backend NotificationsGateway
    const socket = io(`${Config.WS_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // Subscribe to the transaction-specific channel
      socket.emit('subscribe', { channels: [websocketChannel] });
      updateProcessingStep('upload', true);
    });

    // Listen for transaction status updates from backend (emitTransactionStatus)
    socket.on('transaction:status', (data: {
      type: string;
      transactionId: string;
      status?: 'approved' | 'rejected' | 'flagged';
      amount?: number;
      merchantName?: string;
      category?: string;
      verificationResults?: Record<string, unknown>;
      message?: string;
      rejectionReason?: string;
    }) => {
      switch (data.type) {
        case 'ocr_processing':
          updateProcessingStep('upload', true);
          break;
        case 'ocr_complete':
          updateProcessingStep('ocr', true);
          break;
        case 'verification_processing':
          updateProcessingStep('location', true);
          updateProcessingStep('category', true);
          updateProcessingStep('limit', true);
          break;
        case 'transaction_complete': {
          updateProcessingStep('final', true);
          navigation.replace('Result', {
            transactionId: data.transactionId,
            status: data.status!,
            message: data.message ?? '',
            rejectionReason: data.rejectionReason,
            verificationResults: data.verificationResults
              ? JSON.stringify(data.verificationResults)
              : undefined,
            amount: data.amount,
            merchantName: data.merchantName,
            category: data.category,
          });
          break;
        }
      }
    });

    socket.on('connect_error', () => {
      // Socket.IO connection failed, will rely on timeout
    });

    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, 30000);

    return () => {
      clearTimeout(timeout);
      socket.disconnect();
    };
  }, [
    websocketChannel,
    transactionId,
    accessToken,
    navigation,
    updateProcessingStep,
  ]);

  const handleRetry = () => {
    navigation.popToTop();
  };

  if (timedOut) {
    return (
      <View style={styles.container}>
        <Icon source="alert-circle" size={48} color={colors.warning} />
        <Text style={styles.timeoutText}>
          처리 시간이 초과되었습니다.
        </Text>
        <Text style={styles.timeoutSub}>
          잠시 후 거래 내역에서 결과를 확인해주세요.
        </Text>
        <Button mode="contained" onPress={handleRetry} style={styles.retryBtn}>
          돌아가기
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>처리 중...</Text>

      <View style={styles.steps}>
        {processingSteps.map((step) => (
          <View key={step.key} style={styles.stepRow}>
            <Icon
              source={step.completed ? 'check-circle' : 'circle-outline'}
              size={24}
              color={step.completed ? colors.success : colors.disabled}
            />
            <Text
              style={[
                styles.stepLabel,
                step.completed && styles.stepCompleted,
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <ProgressBar
        progress={progress}
        color={colors.primary}
        style={styles.progress}
      />
      <Text style={styles.progressText}>
        예상 소요 시간: 3초 이내
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 32,
  },
  steps: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  stepCompleted: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  progress: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
  timeoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  timeoutSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 24,
  },
});
