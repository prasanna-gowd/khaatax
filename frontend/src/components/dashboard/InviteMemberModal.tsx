import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Group } from '../../types';
import { Copy, Share2, Check, UserPlus, Send, MessageCircle } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ isOpen, onClose, group }) => {
  const [copied, setCopied] = useState(false);
  const [friendInput, setFriendInput] = useState('');
  const [invitedMessage, setInvitedMessage] = useState<string | null>(null);

  const inviteText = `Hey! Join my shared money ledger "${group.name}" on KhaataX using Group Code: ${group.code}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join ${group.name} on KhaataX`,
        text: inviteText,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleQuickInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendInput.trim()) return;
    setInvitedMessage(`Invite link generated for ${friendInput.trim()}! Copy the message below to send via WhatsApp or SMS.`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add / Invite Friend to Group">
      <div className="space-y-5">
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <UserPlus className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Invite your roommate or partner</h3>
          <p className="text-xs text-slate-300">
            Share this group code with your friend. When they enter the code during registration or from "Join Group", both of you will share this ledger in real-time!
          </p>
        </div>

        {/* Group Code Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Group Code</span>
          <div className="text-4xl font-mono font-black text-emerald-400 tracking-widest my-1">
            {group.code}
          </div>
          <div className="flex justify-center space-x-2 pt-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Invite</span>
            </button>
          </div>
        </div>

        {/* Direct WhatsApp / Quick Invite Message Generator */}
        <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-800 space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Send Invite Message via WhatsApp or SMS
          </label>
          <form onSubmit={handleQuickInvite} className="flex space-x-2">
            <input
              type="text"
              placeholder="Friend's Name or Phone (Optional)"
              value={friendInput}
              onChange={(e) => setFriendInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-500 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Format</span>
            </button>
          </form>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
            <div className="text-xs text-slate-300 font-mono italic">
              "{inviteText}"
            </div>
            <button
              onClick={() => {
                const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(inviteText)}`;
                window.open(whatsappUrl, '_blank');
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send via WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
