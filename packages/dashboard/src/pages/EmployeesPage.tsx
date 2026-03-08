import React, { useState } from 'react';
import { Typography, Button, Modal, Input, Select, Space } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@/api/employees.api';
import { EmployeeTable } from '@/components/employee/EmployeeTable';
import { EmployeeForm } from '@/components/employee/EmployeeForm';
import { EmployeeDetail } from '@/components/employee/EmployeeDetail';
import { useNotification } from '@/hooks/useNotification';
import type { Employee } from '@/types/models.types';
import { DEFAULT_PAGE_SIZE } from '@/constants/config';

const { Title } = Typography;

export const EmployeesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<string | undefined>();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, pageSize, search, department],
    queryFn: () => employeesApi.getList({ page, limit: pageSize, search, department }),
  });

  const createMutation = useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      showSuccess('직원 등록 완료');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setFormModalOpen(false);
    },
    onError: () => showError('직원 등록 실패'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      employeesApi.update(id, data),
    onSuccess: () => {
      showSuccess('직원 정보 수정 완료');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setFormModalOpen(false);
      setEditingEmployee(null);
    },
    onError: () => showError('직원 정보 수정 실패'),
  });

  const handleViewDetail = async (id: string) => {
    try {
      const employee = await employeesApi.getById(id);
      setViewingEmployee(employee);
      setDetailModalOpen(true);
    } catch {
      showError('직원 상세 조회 실패');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormModalOpen(true);
  };

  const handleSubmit = (values: Partial<Employee>) => {
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: values });
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
        <Title level={4} className="mb-0">직원 관리</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingEmployee(null);
            setFormModalOpen(true);
          }}
        >
          직원 등록
        </Button>
      </div>

      <Space className="mb-4">
        <Input
          placeholder="이름 검색"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          style={{ width: 200 }}
        />
        <Select
          placeholder="부서 필터"
          allowClear
          style={{ width: 150 }}
          value={department}
          onChange={(v) => { setDepartment(v); setPage(1); }}
        >
          <Select.Option value="영업팀">영업팀</Select.Option>
          <Select.Option value="마케팅팀">마케팅팀</Select.Option>
          <Select.Option value="IT팀">IT팀</Select.Option>
          <Select.Option value="재무팀">재무팀</Select.Option>
          <Select.Option value="인사팀">인사팀</Select.Option>
        </Select>
      </Space>

      <EmployeeTable
        data={data?.items ?? []}
        loading={isLoading}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
      />

      <Modal
        title={editingEmployee ? '직원 정보 수정' : '직원 등록'}
        open={formModalOpen}
        onCancel={() => { setFormModalOpen(false); setEditingEmployee(null); }}
        footer={null}
        width={600}
      >
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleSubmit}
          onCancel={() => { setFormModalOpen(false); setEditingEmployee(null); }}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <Modal
        title="직원 상세"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {viewingEmployee && <EmployeeDetail employee={viewingEmployee} />}
      </Modal>
    </div>
  );
};
