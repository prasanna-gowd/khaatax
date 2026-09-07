import React, { useState } from 'react';
import { Category, Group, TransactionType, SplitType } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TransactionFormProps {
  initialType?: TransactionType;
  categories: Category[];
  group: Group;
  onSubmit: (payload: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialType = 'EXPENSE',
  categories,
  group,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { user: currentUser } = useAuth();
  const otherMember = group.members.find((m) => m.user_id !== currentUser?.id)?.user;

  const [transactionType, setTransactionType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(() => {
    const foodCat = categories.find((c) => c.name === 'Food');
    return foodCat ? foodCat.id : categories[0]?.id || '';
  });
  const [paidBy, setPaidBy] = useState<string>(currentUser?.id || '');
  const [splitType, setSplitType] = useState<SplitType>('50_50');
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Description is required');
      return;
    }

    let splitDetailsPayload: Record<string, number> | null = null;
    if (splitType === 'CUSTOM' && transactionType === 'EXPENSE') {
      const shareSum = Object.values(customShares).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
      if (Math.abs(shareSum - numAmount) > 0.01) {
        setErrorMsg(`Custom split shares total (₹${shareSum.toFixed(2)}) must equal total amount (₹${numAmount.toFixed(2)})`);
        return;
      }
      splitDetailsPayload = {};
      group.members.forEach((m) => {
        splitDetailsPayload![m.user_id] = parseFloat(customShares[m.user_id] || '0');
      });
    }

    try {
      await onSubmit({
        amount: numAmount,
        transaction_type: transactionType,
        description: description.trim(),
        category_id: categoryId,
        paid_by: paidBy,
        received_by: transactionType === 'SETTLEMENT' ? (paidBy === currentUser?.id ? otherMember?.id : currentUser?.id) : undefined,
        split_type: splitType,
        split_details: splitDetailsPayload,
        notes: notes.trim() || undefined,
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save transaction');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Transaction Type Selector */}
      <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/60">
        <button
          type="button"
          onClick={() => setTransactionType('EXPENSE')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            transactionType === 'EXPENSE'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Expense ("I Paid")
        </button>
        <button
          type="button"
          onClick={() => setTransactionType('SETTLEMENT')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            transactionType === 'SETTLEMENT'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Settlement ("I Received")
        </button>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-emerald-400 font-bold text-lg">₹</span>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-xl focus:outline-none focus:border-emerald-500 transition-colors"
            required
          />
        </div>
      </div>

      {/* Description Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
        <input
          type="text"
          placeholder={transactionType === 'EXPENSE' ? 'e.g. Dinner, Groceries, WiFi' : 'e.g. UPI transfer, Cash'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          required
        />
      </div>

      {/* Payer Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Paid By</label>
        <select
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        >
          {group.members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.user_id === currentUser?.id ? 'You' : m.user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Split Type Selector (Only for EXPENSE) */}
      {transactionType === 'EXPENSE' && (
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Split</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '50_50', label: '50/50 Equal' },
              { id: 'FULL_AMOUNT', label: 'Full Amount' },
              { id: 'CUSTOM', label: 'Custom Share' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSplitType(st.id as SplitType)}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                  splitType === st.id
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Custom Shares Inputs */}
          {splitType === 'CUSTOM' && (
            <div className="mt-3 space-y-2 bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
              <span className="text-xs text-slate-400 font-medium">Specify share for each member:</span>
              {group.members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between space-x-2">
                  <span className="text-xs text-slate-300 font-medium">
                    {m.user_id === currentUser?.id ? 'Your Share:' : `${m.user.name}'s Share:`}
                  </span>
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={customShares[m.user_id] || ''}
                      onChange={(e) =>
                        setCustomShares({ ...customShares, [m.user_id]: e.target.value })
                      }
                      className="w-full pl-6 pr-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Optional Notes */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Optional Notes</label>
        <textarea
          rows={2}
          placeholder="Add any extra notes or reference..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Form Buttons */}
      <div className="flex space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 transition-all"
        >
          {isLoading ? 'Saving...' : 'Save Transaction'}
        </button>
      </div>
    </form>
  );
};
