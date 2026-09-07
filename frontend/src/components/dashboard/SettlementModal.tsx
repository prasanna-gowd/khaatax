import React, { useState } from 'react';
import { GroupBalance, Group } from '../../types';
import { Modal } from '../common/Modal';
import { Handshake } from 'lucide-react';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: GroupBalance | undefined;
  group: Group;
  onSubmit: (payload: { payee_id: string; amount: number; payment_method: string; reference_note?: string }) => Promise<void>;
  isLoading?: boolean;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  balance,
  group,
  onSubmit,
  isLoading,
}) => {
  const otherMember = group.members.find((m) => m.user_id !== balance?.current_user_id)?.user;
  const payeeId = balance?.creditor_id || otherMember?.id || '';

  const [amount, setAmount] = useState<string>(() => (balance?.amount ? balance.amount.toString() : ''));
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [referenceNote, setReferenceNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid positive settlement amount');
      return;
    }

    try {
      await onSubmit({
        payee_id: payeeId,
        amount: numAmount,
        payment_method: paymentMethod,
        reference_note: referenceNote.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to record settlement');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settle Outstanding Balance">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-center">
          <p className="text-xs text-slate-300">
            Record payment to settle ledger balance with <span className="font-bold text-emerald-400">{otherMember?.name}</span>
          </p>
        </div>

        {/* Settlement Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Settlement Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-emerald-400 font-bold text-lg">₹</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-xl focus:outline-none focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)' },
              { id: 'CASH', label: 'Cash' },
              { id: 'BANK_TRANSFER', label: 'Bank Transfer (IMPS/NEFT)' },
              { id: 'OTHER', label: 'Other' },
            ].map((pm) => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                  paymentMethod === pm.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reference / Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Reference / Note (Optional)</label>
          <input
            type="text"
            placeholder="e.g. UPI Ref #938217 or Cash given at apartment"
            value={referenceNote}
            onChange={(e) => setReferenceNote(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center space-x-2"
          >
            <Handshake className="w-4 h-4" />
            <span>{isLoading ? 'Recording...' : 'Mark as Paid'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
