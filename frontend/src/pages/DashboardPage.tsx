import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiClient } from '../api/client';
import { GroupBalance, Transaction, Category, TransactionType } from '../types';

import { Header } from '../components/common/Header';
import { Navbar } from '../components/common/Navbar';
import { BalanceCard } from '../components/dashboard/BalanceCard';
import { TransactionCard } from '../components/transactions/TransactionCard';
import { Modal } from '../components/common/Modal';
import { TransactionForm } from '../components/transactions/TransactionForm';
import { TransactionDetailsModal } from '../components/transactions/TransactionDetailsModal';
import { SettlementModal } from '../components/dashboard/SettlementModal';
import { InviteMemberModal } from '../components/dashboard/InviteMemberModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Receipt, ArrowRight, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeGroup, groups, isLoading: isGroupLoading } = useGroup();
  const queryClient = useQueryClient();

  const { isConnected } = useWebSocket(activeGroup?.id);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formInitialType, setFormInitialType] = useState<TransactionType>('EXPENSE');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Queries
  const { data: balance, isLoading: isBalanceLoading } = useQuery<GroupBalance>({
    queryKey: ['balance', activeGroup?.id],
    queryFn: async () => {
      const res = await apiClient.get<GroupBalance>(`/groups/${activeGroup?.id}/balance`);
      return res.data;
    },
    enabled: !!activeGroup,
  });

  const { data: transactions, isLoading: isTxLoading } = useQuery<Transaction[]>({
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

  // Mutations
  const createTxMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post(`/groups/${activeGroup?.id}/transactions`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', activeGroup?.id] });
      setIsFormModalOpen(false);
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

  const settleMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post(`/groups/${activeGroup?.id}/settle`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ['balance', activeGroup?.id] });
      queryClient.invalidateQueries({ queryKey: ['analytics', activeGroup?.id] });
    },
  });

  if (isGroupLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 w-full space-y-6">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="list" />
        </main>
      </div>
    );
  }

  if (!activeGroup || groups.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-16 w-full text-center">
          <EmptyState
            icon={Receipt}
            title="No Active Shared Group"
            description="Create a new group or join an existing group with a code to start tracking shared expenses."
            actionLabel="+ Create New Group"
            onAction={() => navigate('/create-group')}
          />
          <div className="mt-4">
            <button
              onClick={() => navigate('/join-group')}
              className="text-sm font-semibold text-teal-400 hover:underline"
            >
              Have a code? Join an existing group →
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16 md:pb-0">
      <Header isConnected={isConnected} />

      <div className="max-w-4xl mx-auto px-4 w-full flex-1 pt-6">
        <Navbar />

        <main className="space-y-6 mt-4 pb-12">
          {/* Balance Display Card */}
          {isBalanceLoading ? (
            <LoadingSkeleton type="card" />
          ) : (
            <BalanceCard
              balance={balance}
              group={activeGroup}
              onIPaidClick={() => {
                setFormInitialType('EXPENSE');
                setIsFormModalOpen(true);
              }}
              onIReceivedClick={() => {
                setFormInitialType('SETTLEMENT');
                setIsFormModalOpen(true);
              }}
              onSettleUpClick={() => setIsSettleModalOpen(true)}
              onInviteClick={() => setIsInviteModalOpen(true)}
            />
          )}

          {/* Recent Ledger Activity */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-extrabold text-slate-200 text-lg">Recent Ledger Transactions</h3>
              {transactions && transactions.length > 5 && (
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center space-x-1"
                >
                  <span>View All ({transactions.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isTxLoading ? (
              <LoadingSkeleton type="list" />
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-2.5">
                {transactions.slice(0, 5).map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    currentUserId={user?.id || ''}
                    group={activeGroup}
                    onClick={(t) => {
                      setSelectedTx(t);
                      setIsDetailModalOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Receipt}
                title="No Transactions Yet"
                description="Start recording shared expenses or payments using the buttons above."
                actionLabel="+ Record First Expense"
                onAction={() => {
                  setFormInitialType('EXPENSE');
                  setIsFormModalOpen(true);
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Transaction Entry Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formInitialType === 'EXPENSE' ? 'Record Expense ("I Paid")' : 'Record Settlement ("I Received")'}
      >
        <TransactionForm
          initialType={formInitialType}
          categories={categories}
          group={activeGroup}
          onSubmit={async (payload) => {
            await createTxMutation.mutateAsync(payload);
          }}
          onCancel={() => setIsFormModalOpen(false)}
          isLoading={createTxMutation.isPending}
        />
      </Modal>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTx}
        group={activeGroup}
        currentUserId={user?.id || ''}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onDelete={async (id) => {
          await deleteTxMutation.mutateAsync(id);
        }}
      />

      {/* Settlement Up Modal */}
      <SettlementModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        balance={balance}
        group={activeGroup}
        onSubmit={async (payload) => {
          await settleMutation.mutateAsync(payload);
        }}
        isLoading={settleMutation.isPending}
      />

      {/* Invite Member / Add Friend Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        group={activeGroup}
      />
    </div>
  );
};
