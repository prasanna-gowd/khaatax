import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

import { Header } from '../components/common/Header';
import { Navbar } from '../components/common/Navbar';
import { GroupSettingsView } from '../components/settings/GroupSettingsView';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeGroup, refreshGroups } = useGroup();
  const queryClient = useQueryClient();

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiClient.put(`/groups/${activeGroup?.id}`, { name });
    },
    onSuccess: () => {
      refreshGroups();
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiClient.delete(`/groups/${activeGroup?.id}/members/${userId}`);
    },
    onSuccess: () => {
      refreshGroups();
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/groups/${activeGroup?.id}/members/${user?.id}`);
    },
    onSuccess: () => {
      refreshGroups();
      navigate('/dashboard');
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      return apiClient.delete(`/groups/${activeGroup?.id}`);
    },
    onSuccess: () => {
      refreshGroups();
      navigate('/dashboard');
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 w-full flex-1 pt-6">
        <Navbar />

        <main className="space-y-5 mt-4 pb-12">
          <div>
            <h2 className="text-2xl font-black text-white">Group Settings</h2>
            <p className="text-xs text-slate-400">Manage group details, member access, and code sharing.</p>
          </div>

          {activeGroup && (
            <GroupSettingsView
              group={activeGroup}
              onUpdateName={async (name) => {
                await updateNameMutation.mutateAsync(name);
              }}
              onRemoveMember={async (userId) => {
                await removeMemberMutation.mutateAsync(userId);
              }}
              onLeaveGroup={async () => {
                await leaveGroupMutation.mutateAsync();
              }}
              onDeleteGroup={async () => {
                await deleteGroupMutation.mutateAsync();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};
