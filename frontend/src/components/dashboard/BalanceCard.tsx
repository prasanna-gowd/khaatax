import React from 'react';
import { GroupBalance, Group } from '../../types';
import { PlusCircle, ArrowUpRight, CheckCircle2, Handshake, UserPlus, Copy, Share2 } from 'lucide-react';

interface BalanceCardProps {
  balance: GroupBalance | undefined;
  group: Group;
  onIPaidClick: () => void;
  onIReceivedClick: () => void;
  onSettleUpClick: () => void;
  onInviteClick: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  group,
  onIPaidClick,
  onIReceivedClick,
  onSettleUpClick,
  onInviteClick,
}) => {
  const isSingleMember = group.members.length === 1;
  const otherMember = group.members.find((m) => m.user_id !== balance?.current_user_id)?.user;
  const otherName = otherMember?.name || balance?.other_user_name || (isSingleMember ? '2nd Member' : 'Member');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getBalanceContent = () => {
    if (isSingleMember) {
      return {
        title: "Waiting for 2nd Member",
        amountStr: formatCurrency(0),
        subtitle: `Invite a friend or roommate using Group Code: ${group.code}`,
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        cardGlow: 'from-amber-950/20 via-slate-900 to-slate-900',
        textColor: 'text-amber-400',
        icon: UserPlus,
      };
    }

    if (!balance || balance.status === 'settled' || balance.amount === 0) {
      return {
        title: "You're all settled",
        amountStr: formatCurrency(0),
        subtitle: `No pending balance with ${otherName}`,
        badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        cardGlow: 'from-emerald-900/20 to-slate-900',
        textColor: 'text-emerald-400',
        icon: CheckCircle2,
      };
    }

    if (balance.status === 'you_are_owed') {
      return {
        title: `${otherName} owes you`,
        amountStr: formatCurrency(balance.amount),
        subtitle: `Outstanding debt from ${otherName}`,
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        cardGlow: 'from-emerald-950/40 via-slate-900 to-slate-900',
        textColor: 'text-emerald-400',
        icon: ArrowUpRight,
      };
    }

    return {
      title: `You owe ${otherName}`,
      amountStr: formatCurrency(balance.amount),
      subtitle: `Your net debt to ${otherName}`,
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      cardGlow: 'from-rose-950/30 via-slate-900 to-slate-900',
      textColor: 'text-rose-400',
      icon: Handshake,
    };
  };

  const content = getBalanceContent();

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-b ${content.cardGlow} p-6 border border-slate-800 shadow-2xl transition-all`}>
      {/* Background Subtle Accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none"></div>

      {/* Group Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-4 border-b border-slate-800/80 gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Shared Ledger
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{group.name}</h2>
        </div>

        <div className="flex items-center space-x-2">
          {group.members.map((m) => (
            <div
              key={m.id}
              className="px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/60 text-xs font-medium text-slate-300 flex items-center space-x-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>{m.user.name}</span>
            </div>
          ))}

          {/* Add / Invite Member Button */}
          <button
            onClick={onInviteClick}
            className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shadow transition-transform hover:scale-105"
            title="Add Friend to Group"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Friend</span>
          </button>
        </div>
      </div>

      {/* Prominent Banner when 1 Member */}
      {isSingleMember && (
        <div className="mb-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Add your 2nd member to start tracking</div>
              <div className="text-xs text-slate-400">
                Share Group Code: <span className="font-mono font-bold text-emerald-400">{group.code}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onInviteClick}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Invite Friend Now</span>
          </button>
        </div>
      )}

      {/* Prominent Balance Display */}
      <div className="py-4 text-center">
        <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border mb-2 shadow-sm ${content.badgeBg}`}>
          <span>{content.title}</span>
        </div>
        <div className={`text-4xl sm:text-5xl font-black tracking-tight my-1 ${content.textColor}`}>
          {content.amountStr}
        </div>
        <p className="text-xs text-slate-400">{content.subtitle}</p>

        {/* Settle Up Action when balance > 0 */}
        {balance && balance.amount > 0 && !isSingleMember && (
          <div className="mt-4">
            <button
              onClick={onSettleUpClick}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-5 py-2 rounded-xl text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-105"
            >
              <Handshake className="w-4 h-4" />
              <span>Settle Up</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Two Actions */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/80">
        <button
          onClick={onIPaidClick}
          className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-sm font-extrabold">+ I Paid</span>
        </button>

        <button
          onClick={onIReceivedClick}
          className="flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700/80 active:bg-slate-800 text-slate-100 font-bold py-3.5 px-4 rounded-2xl border border-slate-700/80 shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <ArrowUpRight className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-extrabold">↑ I Received</span>
        </button>
      </div>
    </div>
  );
};
