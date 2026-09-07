import React from 'react';
import { Transaction, Group } from '../../types';
import { Utensils, Home, Zap, Wifi, ShoppingCart, Plane, Tv, HeartPulse, ShoppingBag, HandCoins, Tag } from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
  currentUserId: string;
  group: Group;
  onClick: (tx: Transaction) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  currentUserId,
  group,
  onClick,
}) => {
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'utensils': return Utensils;
      case 'home': return Home;
      case 'zap': return Zap;
      case 'wifi': return Wifi;
      case 'shopping-cart': return ShoppingCart;
      case 'plane': return Plane;
      case 'tv': return Tv;
      case 'heart-pulse': return HeartPulse;
      case 'shopping-bag': return ShoppingBag;
      case 'hand-coins': return HandCoins;
      default: return Tag;
    }
  };

  const Icon = getCategoryIcon(transaction.category?.icon);
  const isPayerMe = transaction.paid_by === currentUserId;
  const isSettlement = transaction.transaction_type === 'SETTLEMENT' || transaction.transaction_type === 'PAYMENT';

  const payerObj = group.members.find((m) => m.user_id === transaction.paid_by)?.user;
  const payerName = isPayerMe ? 'You' : payerObj?.name || 'Member';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Balance impact calculation for display card
  const getBalanceImpact = () => {
    if (isSettlement) {
      return {
        text: isPayerMe ? 'You settled debt' : `${payerName} settled debt`,
        color: 'text-teal-400',
      };
    }

    if (transaction.split_type === '50_50') {
      const share = transaction.amount / 2;
      return isPayerMe
        ? { text: `Other owes ${formatAmount(share)}`, color: 'text-emerald-400' }
        : { text: `You owe ${formatAmount(share)}`, color: 'text-rose-400' };
    }

    if (transaction.split_type === 'FULL_AMOUNT') {
      const isTargetMe = transaction.received_by === currentUserId;
      if (isPayerMe) {
        return { text: `Other owes full ${formatAmount(transaction.amount)}`, color: 'text-emerald-400' };
      } else {
        return { text: `You owe full ${formatAmount(transaction.amount)}`, color: 'text-rose-400' };
      }
    }

    if (transaction.split_type === 'CUSTOM' && transaction.split_details) {
      const myShare = transaction.split_details[currentUserId] || 0;
      if (isPayerMe) {
        const otherShare = transaction.amount - myShare;
        return { text: `Other owes ${formatAmount(otherShare)}`, color: 'text-emerald-400' };
      } else {
        return { text: `You owe ${formatAmount(myShare)}`, color: 'text-rose-400' };
      }
    }

    return { text: `${payerName} paid`, color: 'text-slate-400' };
  };

  const impact = getBalanceImpact();

  return (
    <div
      onClick={() => onClick(transaction)}
      className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] hover:border-slate-600 shadow-md group"
    >
      <div className="flex items-center space-x-3.5 min-w-0">
        {/* Category Icon */}
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${
            isSettlement
              ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </div>

        {/* Transaction Meta */}
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-bold text-slate-100 truncate text-base">{transaction.description}</h4>
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-300">
              {transaction.category?.name || 'General'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2">
            <span>{payerName} paid</span>
            <span>•</span>
            <span>{formatDate(transaction.transaction_date)}</span>
          </p>
        </div>
      </div>

      {/* Amount & Impact */}
      <div className="text-right flex-shrink-0 ml-3">
        <div className="text-base font-extrabold text-white">{formatAmount(transaction.amount)}</div>
        <div className={`text-xs font-semibold ${impact.color}`}>{impact.text}</div>
      </div>
    </div>
  );
};
