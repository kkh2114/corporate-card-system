import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, ProgressBar, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { transactionsApi } from '../../api/transactions.api';
import { TransactionCard } from '../../components/transaction/TransactionCard';
import { Loading } from '../../components/common/Loading';
import { formatCurrency } from '../../utils/format';
import { colors } from '../../constants/colors';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  MainTabParamList,
  RootStackParamList,
} from '../../types/navigation.types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'HomeTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () =>
      transactionsApi.getList({
        limit: 3,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      }),
  });

  const recentTransactions = data?.data ?? [];

  // TODO: Replace with real card policy data from API
  const monthlyLimit = 2000000;
  const monthlyUsed = 1234567;
  const monthlyRemaining = monthlyLimit - monthlyUsed;
  const usageRatio = monthlyUsed / monthlyLimit;
  const dailyLimit = 300000;
  const dailyRemaining = 200000;

  if (isLoading) {
    return <Loading fullScreen message="로딩 중..." />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          안녕하세요, {user?.name ?? '직원'}님
        </Text>
        <Text style={styles.department}>
          {user?.department} | 사번: {user?.employeeId}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>이번 달 사용 현황</Text>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>사용액</Text>
            <Text style={styles.usageValue}>
              {formatCurrency(monthlyUsed)}
            </Text>
          </View>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>한도</Text>
            <Text style={styles.usageValue}>
              {formatCurrency(monthlyLimit)}
            </Text>
          </View>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>잔여</Text>
            <Text style={[styles.usageValue, { color: colors.success }]}>
              {formatCurrency(monthlyRemaining)}
            </Text>
          </View>
          <ProgressBar
            progress={usageRatio}
            color={usageRatio > 0.8 ? colors.warning : colors.primary}
            style={styles.progress}
          />
          <Text style={styles.percentage}>
            {Math.round(usageRatio * 100)}% 사용
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.limitRow}>
        <Card style={styles.limitCard}>
          <Card.Content>
            <Text style={styles.limitTitle}>일일 한도</Text>
            <Text style={styles.limitAmount}>
              {formatCurrency(dailyLimit)}
            </Text>
            <Text style={styles.limitRemaining}>
              잔여 {formatCurrency(dailyRemaining)}
            </Text>
          </Card.Content>
        </Card>
        <Card style={styles.limitCard}>
          <Card.Content>
            <Text style={styles.limitTitle}>건별 한도</Text>
            <Text style={styles.limitAmount}>{formatCurrency(200000)}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>최근 거래</Text>
        {recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>거래 내역이 없습니다.</Text>
        ) : (
          recentTransactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              onPress={() =>
                navigation.navigate('TransactionTab', {
                  screen: 'TransactionDetail',
                  params: { transactionId: tx.id },
                } as never)
              }
            />
          ))
        )}
      </View>

      <Button
        mode="contained"
        icon="camera"
        onPress={() => navigation.navigate('ReceiptTab')}
        style={styles.uploadButton}
        contentStyle={styles.uploadButtonContent}
      >
        영수증 업로드하기
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  department: {
    fontSize: 14,
    color: '#FFFFFFCC',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginTop: -12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  usageLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progress: {
    marginTop: 12,
    height: 8,
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  limitRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  limitCard: {
    flex: 1,
  },
  limitTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  limitAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  limitRemaining: {
    fontSize: 12,
    color: colors.success,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: 24,
  },
  uploadButton: {
    margin: 16,
    marginTop: 20,
    marginBottom: 32,
    borderRadius: 8,
  },
  uploadButtonContent: {
    paddingVertical: 6,
  },
});
