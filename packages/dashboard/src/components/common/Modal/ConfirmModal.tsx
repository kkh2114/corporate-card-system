import React from 'react';
import { Modal, Input } from 'antd';

const { TextArea } = Input;

interface ConfirmModalProps {
  title: string;
  open: boolean;
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
  loading?: boolean;
  showReasonInput?: boolean;
  confirmText?: string;
  danger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  open,
  onConfirm,
  onCancel,
  loading,
  showReasonInput = false,
  confirmText = '확인',
  danger = false,
}) => {
  const [reason, setReason] = React.useState('');

  const handleOk = () => {
    onConfirm(showReasonInput ? reason : undefined);
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={confirmText}
      cancelText="취소"
      confirmLoading={loading}
      okButtonProps={{ danger }}
    >
      {showReasonInput && (
        <TextArea
          rows={3}
          placeholder="사유를 입력하세요"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      )}
    </Modal>
  );
};
