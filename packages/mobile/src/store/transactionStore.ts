import { create } from 'zustand';

interface TransactionFilter {
  status: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface TransactionState {
  filter: TransactionFilter;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  resetFilter: () => void;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  filter: {
    status: null,
    startDate: null,
    endDate: null,
  },

  setFilter: (partial) =>
    set((state) => ({
      filter: { ...state.filter, ...partial },
    })),

  resetFilter: () =>
    set({
      filter: { status: null, startDate: null, endDate: null },
    }),
}));
