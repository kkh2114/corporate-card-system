import React, { useState } from 'react';
import { Typography, Modal } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/api/transactions.api';
import { TransactionTable } from '@/components/transaction/TransactionTable';
import { TransactionFilter } from '@/components/transaction/TransactionFilter';
import { TransactionDetail } from '@/components/transaction/TransactionDetail';
import { useNotification } from '@/hooks/useNotification';
import type { TransactionFilterParams } from '@/types/api.types';
import type { Transaction } from '@/types/models.types';
import { DEFAULT_PAGE_SIZE } from '@/constants/config';

const { Title } = Typography;

export const TransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const [filters, setFilters] = useState<TransactionFilterParams>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.getList(filters),
  });

  const approveMutation = useMutation({
    mutationFn: transactionsApi.approve,
    onSuccess: () => {
      showSuccess('승인 완료', '거래가 승인되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setDetailModalOpen(false);
    },
    onError: () => showError('승인 실패'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.reject(id, '관리자 거절'),
    onSuccess: () => {
      showSuccess('거절 완료', '거래가 거절되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setDetailModalOpen(false);
    },
    onError: () => showError('거절 실패'),
  });

  const flagMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.flag(id, '관리자 플래그'),
    onSuccess: () => {
      showSuccess('플래그 지정 완료');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setDetailModalOpen(false);
    },
    onError: () => showError('플래그 지정 실패'),
  });

  const handleViewDetail = async (id: string) => {
    try {
      const transaction = await transactionsApi.getById(id);
      setSelectedTransaction(transaction);
      setDetailModalOpen(true);
    } catch {
      showError('거래 상세 조회 실패');
    }
  };

  const handleFilter = (values: TransactionFilterParams) => {
    setFilters({ ...values, page: 1, limit: filters.limit });
  };

  const handleReset = () => {
    setFilters({ page: 1, limit: DEFAULT_PAGE_SIZE });
  };

  const handlePageChange = (page: number, pageSize: number) => {
    setFilters((prev) => ({ ...prev, page, limit: pageSize }));
  };

  return (
    <div>
      <Title level={4} className="mb-4">거래 내역</Title>

      <TransactionFilter onFilter={handleFilter} onReset={handleReset} />

      <TransactionTable
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.total ?? 0}
        page={filters.page ?? 1}
        pageSize={filters.limit ?? DEFAULT_PAGE_SIZE}
        onPageChange={handlePageChange}
        onViewDetail={handleViewDetail}
      />

      <Modal
        title="거래 상세"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedTransaction && (
          <TransactionDetail
            transaction={selectedTransaction}
            onApprove={approveMutation.mutate}
            onReject={rejectMutation.mutate}
            onFlag={flagMutation.mutate}
          />
        )}
      </Modal>
    </div>
  );
};
