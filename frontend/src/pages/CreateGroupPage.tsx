import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useGroup } from '../context/GroupContext';
import { Group } from '../types';
import { Copy, Share2, ArrowRight, Check, Users } from 'lucide-react';

export const CreateGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshGroups, setActiveGroupId } = useGroup();

  const [groupName, setGroupName] = useState('');
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!groupName.trim()) {
      setErrorMsg('Group name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post<Group>('/groups', { name: groupName.trim() });
      setCreatedGroup(res.data);
      await refreshGroups();
      setActiveGroupId(res.data.id);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdGroup) return;
    navigator.clipboard.writeText(createdGroup.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Create a Shared Group</h2>
          <p className="text-xs text-slate-400">
            Set up a new financial ledger for you and your roommate or partner.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {!createdGroup ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name</label>
              <input
                type="text"
                placeholder="e.g. Room Expenses, Goa Trip, Apartment 402"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-emerald-600/25 transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        ) : (
          <div className="space-y-5 text-center">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Group Created Successfully!
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{createdGroup.name}</h3>

              <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block font-medium">Unique Group Code</span>
                <span className="text-3xl font-mono font-black text-emerald-400 tracking-widest my-1 block">
                  {createdGroup.code}
                </span>
                <span className="text-[10px] text-slate-500">Share this code with the 2nd member</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleCopyCode}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
