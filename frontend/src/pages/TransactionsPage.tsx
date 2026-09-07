import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Transaction, Category } from '../types';

import { Header } from '../components/common/Header';
import { Navbar } from '../components/common/Navbar';
import { TransactionCard } from '../components/transactions/TransactionCard';
import { TransactionDetailsModal } from '../components/transactions/TransactionDetailsModal';
import { Modal } from '../components/common/Modal';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Search, PlusCircle, Filter } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const { user } = useAuth();
  const { activeGroup } = useGroup();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', activeGroup?.id],
    queryFn: async () => {
      const res = await apiClient.get<Transaction[]>(`/groups/${activeGroup?.id}/transactions`);
      return res.data;
    },
    enabled: !!activeGroup,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiClient.get<Category[]>('/categories');
      return res.data;
    },
    enabled: !!activeGroup,
  });

  const createTxMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post(`/groups/${activeGroup?.id}/transactions`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', activeGroup?.id] });
      setIsFormOpen(false);
    },
  });

  const deleteTxMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', activeGroup?.id] });
    },
  });

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'EXPENSE') return matchesSearch && tx.transaction_type === 'EXPENSE';
    if (filterType === 'SETTLEMENT') return matchesSearch && tx.transaction_type === 'SETTLEMENT';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 w-full flex-1 pt-6">
        <Navbar />

        <main className="space-y-5 mt-4 pb-12">
          {/* Header & Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Ledger History</h2>
              <p className="text-xs text-slate-400">All recorded expenses, payments, and settlements.</p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Transaction</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions by description or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {['ALL', 'EXPENSE', 'SETTLEMENT'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    filterType === type ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {isLoading ? (
            <LoadingSkeleton type="list" />
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-2.5">
              {filteredTransactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  currentUserId={user?.id || ''}
                  group={activeGroup!}
                  onClick={(t) => {
                    setSelectedTx(t);
                    setIsDetailOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Filter}
              title="No Matching Transactions"
              description="No transactions found matching your search criteria."
            />
          )}
        </main>
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Record Transaction">
        <TransactionForm
          categories={categories}
          group={activeGroup!}
          onSubmit={async (p) => {
            await createTxMutation.mutateAsync(p);
          }}
          onCancel={() => setIsFormOpen(false)}
          isLoading={createTxMutation.isPending}
        />
      </Modal>

      <TransactionDetailsModal
        transaction={selectedTx}
        group={activeGroup!}
        currentUserId={user?.id || ''}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onDelete={async (id) => {
          await deleteTxMutation.mutateAsync(id);
        }}
      />
    </div>
  );
};
