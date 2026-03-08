import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatTime } from '../../utils/format';
import { colors } from '../../constants/colors';
import type { Transaction } from '../../types/models.types';

interface TransactionCardProps {
  transaction: Transaction;
  onPress: (id: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(transaction.id)}
      activeOpacity={0.7}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.merchant}>{transaction.merchantName}</Text>
          <Text style={styles.meta}>
            {formatTime(transaction.transactionDate)} {'  '}
            {transaction.category}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>
            {formatCurrency(transaction.amount)}
          </Text>
          <StatusBadge status={transaction.status} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
