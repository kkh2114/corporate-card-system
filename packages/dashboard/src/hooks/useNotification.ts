import { useCallback } from 'react';
import { notification } from 'antd';

export function useNotification() {
  const showSuccess = useCallback((message: string, description?: string) => {
    notification.success({ message, description, placement: 'topRight' });
  }, []);

  const showError = useCallback((message: string, description?: string) => {
    notification.error({ message, description, placement: 'topRight' });
  }, []);

  const showWarning = useCallback((message: string, description?: string) => {
    notification.warning({ message, description, placement: 'topRight' });
  }, []);

  const showInfo = useCallback((message: string, description?: string) => {
    notification.info({ message, description, placement: 'topRight' });
  }, []);

  return { showSuccess, showError, showWarning, showInfo };
}
