import { create } from 'zustand';
import type { Alert, Transaction } from '@/types/models.types';

interface DashboardState {
  realtimeTransactions: Transaction[];
  alerts: Alert[];
  unreadAlertCount: number;
  addTransaction: (transaction: Transaction) => void;
  addAlert: (alert: Alert) => void;
  markAlertRead: (alertId: string) => void;
  setAlerts: (alerts: Alert[]) => void;
  setRealtimeTransactions: (transactions: Transaction[]) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  realtimeTransactions: [],
  alerts: [],
  unreadAlertCount: 0,

  addTransaction: (transaction) =>
    set((state) => ({
      realtimeTransactions: [transaction, ...state.realtimeTransactions].slice(
        0,
        50
      ),
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadAlertCount: state.unreadAlertCount + 1,
    })),

  markAlertRead: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, isRead: true } : a
      ),
      unreadAlertCount: Math.max(0, state.unreadAlertCount - 1),
    })),

  setAlerts: (alerts) =>
    set({
      alerts,
      unreadAlertCount: alerts.filter((a) => !a.isRead).length,
    }),

  setRealtimeTransactions: (transactions) =>
    set({ realtimeTransactions: transactions }),
}));
