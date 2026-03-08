import React, { useState } from 'react';
import { Typography, Button, Modal } from 'antd';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policiesApi } from '@/api/policies.api';
import { PolicyTable } from '@/components/policy/PolicyTable';
import { PolicyForm } from '@/components/policy/PolicyForm';
import { PolicyDetail } from '@/components/policy/PolicyDetail';
import { useNotification } from '@/hooks/useNotification';
import type { CardPolicy } from '@/types/models.types';
import { DEFAULT_PAGE_SIZE } from '@/constants/config';

const { Title } = Typography;
const { confirm } = Modal;

export const PoliciesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CardPolicy | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<CardPolicy | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['policies', page, pageSize],
    queryFn: () => policiesApi.getList({ page, limit: pageSize }),
  });

  const createMutation = useMutation({
    mutationFn: policiesApi.create,
    onSuccess: () => {
      showSuccess('정책 생성 완료');
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setFormModalOpen(false);
    },
    onError: () => showError('정책 생성 실패'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CardPolicy> }) =>
      policiesApi.update(id, data),
    onSuccess: () => {
      showSuccess('정책 수정 완료');
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      setFormModalOpen(false);
      setEditingPolicy(null);
    },
    onError: () => showError('정책 수정 실패'),
  });

  const deleteMutation = useMutation({
    mutationFn: policiesApi.delete,
    onSuccess: () => {
      showSuccess('정책 삭제 완료');
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: () => showError('정책 삭제 실패'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      policiesApi.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['policies'] });
    },
    onError: () => showError('상태 변경 실패'),
  });

  const handleViewDetail = async (id: string) => {
    try {
      const policy = await policiesApi.getById(id);
      setViewingPolicy(policy);
      setDetailModalOpen(true);
    } catch {
      showError('정책 상세 조회 실패');
    }
  };

  const handleEdit = (policy: CardPolicy) => {
    setEditingPolicy(policy);
    setFormModalOpen(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: '정책을 삭제하시겠습니까?',
      icon: <ExclamationCircleOutlined />,
      content: '삭제된 정책은 복구할 수 없습니다.',
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleSubmit = (values: Partial<CardPolicy>) => {
    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Title level={4} className="mb-0">정책 관리</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingPolicy(null);
            setFormModalOpen(true);
          }}
        >
          정책 생성
        </Button>
      </div>

      <PolicyTable
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={(id, isActive) => toggleMutation.mutate({ id, isActive })}
      />

      <Modal
        title={editingPolicy ? '정책 수정' : '정책 생성'}
        open={formModalOpen}
        onCancel={() => { setFormModalOpen(false); setEditingPolicy(null); }}
        footer={null}
        width={800}
      >
        <PolicyForm
          policy={editingPolicy}
          onSubmit={handleSubmit}
          onCancel={() => { setFormModalOpen(false); setEditingPolicy(null); }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <Modal
        title="정책 상세"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {viewingPolicy && <PolicyDetail policy={viewingPolicy} />}
      </Modal>
    </div>
  );
};
