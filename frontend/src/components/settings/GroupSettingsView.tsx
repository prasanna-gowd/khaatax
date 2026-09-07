import React, { useState } from 'react';
import { Group } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Copy, Share2, Edit3, Trash2, LogOut, UserMinus, ShieldCheck, User as UserIcon, Check } from 'lucide-react';

interface GroupSettingsViewProps {
  group: Group;
  onUpdateName: (newName: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onLeaveGroup: () => Promise<void>;
  onDeleteGroup: () => Promise<void>;
}

export const GroupSettingsView: React.FC<GroupSettingsViewProps> = ({
  group,
  onUpdateName,
  onRemoveMember,
  onLeaveGroup,
  onDeleteGroup,
}) => {
  const { user: currentUser } = useAuth();
  const isOwner = group.owner_id === currentUser?.id;

  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(group.name);
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: `Join ${group.name} on KhaataX`,
        text: `Use group code ${group.code} to join our shared financial ledger on KhaataX!`,
      }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      await onUpdateName(groupName.trim());
      setIsEditingName(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to update group name');
    }
  };

  const maskEmailOrPhone = (str: string) => {
    if (str.includes('@')) {
      const [name, domain] = str.split('@');
      return `${name.slice(0, 2)}***@${domain}`;
    }
    return `${str.slice(0, 3)}*****${str.slice(-2)}`;
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {errorMsg && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Group Info & Code Share */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          {!isEditingName ? (
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-black text-white">{group.name}</h2>
              {isOwner && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveName} className="flex items-center space-x-2 flex-1">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="bg-slate-900 border border-emerald-500 text-white font-bold text-lg px-3 py-1.5 rounded-xl flex-1 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs"
              >
                Save
              </button>
            </form>
          )}
        </div>

        {/* Code Box */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium">Group Code</span>
            <div className="text-2xl font-mono font-black text-emerald-400 tracking-wider">
              {group.code}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleShareCode}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-slate-100 text-lg flex items-center space-x-2">
          <UserIcon className="w-5 h-5 text-emerald-400" />
          <span>Group Members ({group.members.length}/2)</span>
        </h3>

        <div className="space-y-3">
          {group.members.map((m) => {
            const isMe = m.user_id === currentUser?.id;
            const isMemberOwner = m.role === 'OWNER';

            return (
              <div
                key={m.id}
                className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                    {m.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">{m.user.name}</span>
                      {isMe && <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">(You)</span>}
                      {isMemberOwner && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Owner
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {maskEmailOrPhone(m.user.email_or_phone)}
                    </div>
                  </div>
                </div>

                {/* Remove member button for owner */}
                {isOwner && !isMe && (
                  <div>
                    {confirmRemoveMemberId !== m.user_id ? (
                      <button
                        onClick={() => setConfirmRemoveMemberId(m.user_id)}
                        className="p-2 text-rose-400 hover:bg-rose-900/30 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setConfirmRemoveMemberId(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            await onRemoveMember(m.user_id);
                            setConfirmRemoveMemberId(null);
                          }}
                          className="px-2 py-1 bg-rose-600 text-white text-xs font-bold rounded"
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Zone Actions */}
      <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-rose-300 text-base">Danger Zone</h3>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Leave Group Button */}
          <button
            onClick={onLeaveGroup}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center space-x-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Group</span>
          </button>

          {/* Delete Group Button for Owner */}
          {isOwner && (
            <div className="flex-1">
              {!confirmDeleteGroup ? (
                <button
                  onClick={() => setConfirmDeleteGroup(true)}
                  className="w-full py-2.5 px-4 bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-bold border border-rose-800/40 flex items-center justify-center space-x-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Group</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setConfirmDeleteGroup(false)}
                    className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onDeleteGroup}
                    className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow"
                  >
                    Confirm Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
