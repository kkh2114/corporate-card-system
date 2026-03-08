import { useEffect } from 'react';
import { wsService } from '@/services/WebSocketService';
import { useDashboardStore } from '@/store/dashboardStore';
import type { Transaction, Alert } from '@/types/models.types';

export function useWebSocket() {
  const { addTransaction, addAlert } = useDashboardStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = wsService.connect(token);

    socket.on('transaction:new', (data: Transaction) => {
      addTransaction(data);
    });

    socket.on('alert:new', (data: Alert) => {
      addAlert(data);
    });

    return () => {
      wsService.disconnect();
    };
  }, [addTransaction, addAlert]);
}
