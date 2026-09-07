import React, { useState } from 'react';
import { Transaction, Group } from '../../types';
import { Modal } from '../common/Modal';
import { Trash2, Calendar, User, Tag, FileText, CheckCircle2 } from 'lucide-react';

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  group: Group;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  group,
  currentUserId,
  isOpen,
  onClose,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!transaction) return null;

  const isPayerMe = transaction.paid_by === currentUserId;
  const payerObj = group.members.find((m) => m.user_id === transaction.paid_by)?.user;
  const payerName = isPayerMe ? 'You' : payerObj?.name || 'Member';

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      setConfirmDelete(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Details">
      <div className="space-y-5">
        {/* Amount & Description Header */}
        <div className="text-center py-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
          <div className="text-xs font-semibold uppercase text-slate-400">
            {transaction.transaction_type}
          </div>
          <div className="text-3xl font-black text-emerald-400 my-1">
            {formatAmount(transaction.amount)}
          </div>
          <div className="text-base font-bold text-slate-200">{transaction.description}</div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 bg-slate-800/30 p-4 rounded-xl border border-slate-800 text-sm">
          <div className="flex items-center justify-between py-1 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Paid By:</span>
            </div>
            <span className="font-semibold text-slate-200">{payerName}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Category:</span>
            </div>
            <span className="font-semibold text-slate-200">{transaction.category?.name || 'General'}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Split Type:</span>
            </div>
            <span className="font-semibold text-slate-200 uppercase">{transaction.split_type.replace('_', ' ')}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="flex items-center space-x-2 text-slate-400">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Date:</span>
            </div>
            <span className="font-semibold text-slate-200">{formatDate(transaction.transaction_date)}</span>
          </div>

          {transaction.notes && (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center space-x-2 text-slate-400 mb-1">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Notes:</span>
              </div>
              <p className="text-xs text-slate-300 bg-slate-900/60 p-2 rounded-lg italic">
                "{transaction.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation / Trigger */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 bg-rose-900/20 hover:bg-rose-900/40 text-rose-400 border border-rose-800/40 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Transaction</span>
          </button>
        ) : (
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-center space-y-3">
            <p className="text-xs text-rose-200 font-medium">
              Are you sure you want to delete this transaction? This will recalculate the ledger balance.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
