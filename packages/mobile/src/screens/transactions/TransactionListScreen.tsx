import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, SectionList } from 'react-native';
import { Text, Chip, Divider } from 'react-native-paper';
import { useInfiniteQuery } from '@tanstack/react-query';
import { transactionsApi } from '../../api/transactions.api';
import { TransactionCard } from '../../components/transaction/TransactionCard';
import { Loading } from '../../components/common/Loading';
import { EmptyState } from '../../components/common/EmptyState';
import { useTransactionStore } from '../../store/transactionStore';
import { formatDateGroup } from '../../utils/format';
import { colors } from '../../constants/colors';
import { Config } from '../../constants/config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TransactionStackParamList } from '../../types/navigation.types';
import type { Transaction } from '../../types/models.types';

type Props = NativeStackScreenProps<TransactionStackParamList, 'TransactionList'>;

const statusFilters = [
  { key: null, label: '전체' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
  { key: 'flagged', label: '주의' },
];

export const TransactionListScreen: React.FC<Props> = ({ navigation }) => {
  const { filter, setFilter } = useTransactionStore();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['transactions', filter],
    queryFn: ({ pageParam = 1 }) =>
      transactionsApi.getList({
        page: pageParam,
        limit: Config.TRANSACTION_PAGE_SIZE,
        status: filter.status ?? undefined,
        startDate: filter.startDate ?? undefined,
        endDate: filter.endDate ?? undefined,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.metadata;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allTransactions = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const sections = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    for (const tx of allTransactions) {
      const dateKey = tx.transactionDate.split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(tx);
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        title: formatDateGroup(date),
        data: items,
      }));
  }, [allTransactions]);

  const handleTransactionPress = useCallback(
    (id: string) => {
      navigation.navigate('TransactionDetail', { transactionId: id });
    },
    [navigation],
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="내역을 불러오는 중..." />;
  }

  return (
    <View style={styles.container}>
      {/* Status Filter */}
      <View style={styles.filterRow}>
        {statusFilters.map((f) => (
          <Chip
            key={f.key ?? 'all'}
            selected={filter.status === f.key}
            onPress={() => setFilter({ status: f.key })}
            style={styles.chip}
            selectedColor={colors.primary}
          >
            {f.label}
          </Chip>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionCard
            transaction={item}
            onPress={handleTransactionPress}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        ItemSeparatorComponent={() => <Divider />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <EmptyState
            icon="receipt"
            message="거래 내역이 없습니다."
          />
        }
        ListFooterComponent={
          isFetchingNextPage ? <Loading message="더 불러오는 중..." /> : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chip: {
    height: 32,
  },
  sectionHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
