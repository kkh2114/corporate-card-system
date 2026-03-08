import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, TextInput, Card, Icon, Snackbar } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { formatCurrency } from '../../utils/format';
import { receiptsApi } from '../../api/receipts.api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ReceiptStackParamList } from '../../types/navigation.types';

type Props = NativeStackScreenProps<ReceiptStackParamList, 'Confirm'>;

const CATEGORY_OPTIONS = ['식음료', '교통', '사무용품', '숙박', '기타'];

export const ReceiptConfirmScreen: React.FC<Props> = ({ navigation, route }) => {
  const { receiptId, scanResult } = route.params;

  const [merchantName, setMerchantName] = useState(scanResult.merchantName || '');
  const [amount, setAmount] = useState(String(scanResult.amount || 0));
  const [vat, setVat] = useState(String(scanResult.vat || 0));
  const [category, setCategory] = useState(scanResult.category || '기타');
  const [address, setAddress] = useState(scanResult.address || '');
  const [transactionDate, setTransactionDate] = useState(scanResult.transactionDate || '');
  const [submitting, setSubmitting] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');

  const handleConfirm = async () => {
    if (!merchantName.trim() || !amount) {
      setSnackMessage('상호명과 금액은 필수 항목입니다.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await receiptsApi.confirm({
        receiptId,
        merchantName,
        amount: Number(amount),
        vat: Number(vat),
        category,
        address,
        transactionDate,
        businessNumber: scanResult.businessNumber,
        items: scanResult.items,
      });

      navigation.replace('Processing', {
        transactionId: result.receiptId,
        receiptId: result.receiptId,
        websocketChannel: `receipt:${result.receiptId}`,
      });
    } catch {
      setSnackMessage('제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* LLM Correction Info */}
      {scanResult.llmCorrected && scanResult.corrections?.length > 0 && (
        <Card style={[styles.card, styles.correctionCard]}>
          <Card.Content>
            <View style={styles.correctionHeader}>
              <Icon source="auto-fix" size={20} color={colors.primary} />
              <Text style={styles.correctionTitle}>AI 자동 보정 적용됨</Text>
            </View>
            {scanResult.corrections.map((c: string, i: number) => (
              <Text key={i} style={styles.correctionItem}>  {c}</Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* OCR Confidence */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.confidenceRow}>
            <Text style={styles.label}>OCR 인식 신뢰도</Text>
            <Text style={[
              styles.confidenceValue,
              { color: scanResult.confidence >= 0.8 ? colors.success : colors.warning },
            ]}>
              {Math.round(scanResult.confidence * 100)}%
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Editable Fields */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>영수증 정보 확인</Text>
          <Text style={styles.sectionSub}>자동 인식된 정보를 확인하고 필요시 수정해주세요.</Text>

          <TextInput
            label="상호명 *"
            value={merchantName}
            onChangeText={setMerchantName}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="금액 *"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            right={<TextInput.Affix text="원" />}
          />

          <TextInput
            label="부가세"
            value={vat}
            onChangeText={setVat}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            right={<TextInput.Affix text="원" />}
          />

          <Text style={styles.categoryLabel}>카테고리</Text>
          <View style={styles.categoryRow}>
            {CATEGORY_OPTIONS.map((opt) => (
              <Button
                key={opt}
                mode={category === opt ? 'contained' : 'outlined'}
                onPress={() => setCategory(opt)}
                compact
                style={styles.categoryBtn}
                labelStyle={styles.categoryBtnLabel}
              >
                {opt}
              </Button>
            ))}
          </View>

          <TextInput
            label="주소"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            style={styles.input}
          />

          <TextInput
            label="거래 일시"
            value={transactionDate}
            onChangeText={setTransactionDate}
            mode="outlined"
            style={styles.input}
          />
        </Card.Content>
      </Card>

      {/* Items */}
      {scanResult.items?.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>품목 내역</Text>
            {scanResult.items.map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.quantity}개</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Submit */}
      <Button
        mode="contained"
        onPress={handleConfirm}
        loading={submitting}
        disabled={submitting}
        style={styles.submitButton}
        contentStyle={styles.submitButtonContent}
      >
        확인 및 제출
      </Button>

      <Snackbar
        visible={!!snackMessage}
        onDismiss={() => setSnackMessage('')}
        duration={3000}
        action={{ label: '확인', onPress: () => setSnackMessage('') }}
      >
        {snackMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  correctionCard: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
  },
  correctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  correctionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  correctionItem: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryBtn: {
    borderRadius: 20,
  },
  categoryBtnLabel: {
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  itemQty: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  submitButton: {
    margin: 16,
    marginBottom: 32,
    borderRadius: 8,
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
});
