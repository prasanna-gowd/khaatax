import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { LogOut, ChevronDown, User as UserIcon, Plus, Sparkles, Bell, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { AIQuickAddModal } from '../ai/AIQuickAddModal';
import { AIQueryModal } from '../ai/AIQueryModal';
import { Category } from '../../types';

interface HeaderProps {
  isConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isConnected }) => {
  const { user, logout } = useAuth();
  const { groups, activeGroup, setActiveGroupId } = useGroup();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isAIQuickAddOpen, setIsAIQuickAddOpen] = useState(false);
  const [isAIQueryOpen, setIsAIQueryOpen] = useState(false);

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['notifications', activeGroup?.id],
    queryFn: async () => {
      const res = await apiClient.get(`/groups/${activeGroup?.id}/notifications`);
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleDownloadStatement = () => {
    if (!activeGroup) return;
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    window.open(`${baseURL}/groups/${activeGroup.id}/statement`, '_blank');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white px-4 py-3 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Brand & Group Switcher */}
          <div className="flex items-center space-x-3">
            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                K
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                Khaata<span className="text-emerald-400">X</span>
              </span>
            </div>

            {/* Group Switcher */}
            {activeGroup && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-200 border border-slate-700/60 transition-colors"
                >
                  <span className="max-w-[100px] sm:max-w-[160px] truncate">{activeGroup.name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-1.5 z-50">
                    <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Your Groups
                    </div>
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setActiveGroupId(g.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-700/60 transition-colors ${
                          g.id === activeGroup.id ? 'text-emerald-400 font-semibold bg-slate-700/30' : 'text-slate-200'
                        }`}
                      >
                        <span className="truncate">{g.name}</span>
                        <span className="text-xs font-mono bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">
                          {g.code}
                        </span>
                      </button>
                    ))}
                    <div className="border-t border-slate-700/60 my-1"></div>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/create-group');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-slate-700/60 flex items-center space-x-2 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Group</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2">
            {activeGroup && (
              <>
                {/* AI Entry Button */}
                <button
                  onClick={() => setIsAIQuickAddOpen(true)}
                  title="AI Smart Expense Entry"
                  className="flex items-center space-x-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold shadow transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">AI Add</span>
                </button>

                {/* Statement Export Button */}
                <button
                  onClick={handleDownloadStatement}
                  title="View/Download Printable Statement"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    title="Notifications"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors relative"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-800 rounded-xl shadow-xl border border-slate-700 py-2 z-50">
                      <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                        Group Notifications
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-700/40">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className="p-3 hover:bg-slate-700/30 text-xs">
                              <div className="font-bold text-slate-200">{n.title}</div>
                              <div className="text-slate-400 mt-0.5">{n.message}</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/30 hover:text-rose-400 text-slate-400 border border-slate-700/60 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* AI Quick Add Modal */}
      {activeGroup && (
        <>
          <AIQuickAddModal
            isOpen={isAIQuickAddOpen}
            onClose={() => setIsAIQuickAddOpen(false)}
            group={activeGroup}
            categories={categories}
            onConfirmSave={async (payload) => {
              await apiClient.post(`/groups/${activeGroup.id}/transactions`, payload);
            }}
          />

          <AIQueryModal
            isOpen={isAIQueryOpen}
            onClose={() => setIsAIQueryOpen(false)}
            group={activeGroup}
          />
        </>
      )}
    </>
  );
};
