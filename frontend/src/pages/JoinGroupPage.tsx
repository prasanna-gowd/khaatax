import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useGroup } from '../context/GroupContext';
import { Group } from '../types';
import { LogIn } from 'lucide-react';

export const JoinGroupPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshGroups, setActiveGroupId } = useGroup();

  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!code.trim()) {
      setErrorMsg('Please enter a 6-character group code');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post<Group>('/groups/join', { code: code.trim().toUpperCase() });
      await refreshGroups();
      setActiveGroupId(res.data.id);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to join group. Please verify the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Join Existing Group</h2>
          <p className="text-xs text-slate-400">
            Enter the 6-character group code provided by the group creator.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Code</label>
            <input
              type="text"
              placeholder="e.g. KX72P9"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold text-center text-xl tracking-widest focus:outline-none focus:border-teal-500 uppercase"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-lg shadow-teal-600/25 transition-all"
          >
            {isSubmitting ? 'Joining...' : 'Join Group'}
          </button>
        </form>
      </div>
    </div>
  );
};
