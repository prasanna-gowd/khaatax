import React, { createContext, useContext, useState, useEffect } from 'react';
import { Group } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';

interface GroupContextType {
  groups: Group[];
  activeGroup: Group | null;
  isLoading: boolean;
  setActiveGroupId: (id: string) => void;
  refreshGroups: () => Promise<void>;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export const GroupProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(() => {
    return localStorage.getItem('khaatax_active_group_id');
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshGroups = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get<Group[]>('/groups');
      setGroups(res.data);
      if (res.data.length > 0) {
        if (!activeGroupId || !res.data.find((g) => g.id === activeGroupId)) {
          setActiveGroupIdState(res.data[0].id);
          localStorage.setItem('khaatax_active_group_id', res.data[0].id);
        }
      } else {
        setActiveGroupIdState(null);
        localStorage.removeItem('khaatax_active_group_id');
      }
    } catch {
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshGroups();
    } else {
      setGroups([]);
      setActiveGroupIdState(null);
    }
  }, [isAuthenticated]);

  const setActiveGroupId = (id: string) => {
    setActiveGroupIdState(id);
    localStorage.setItem('khaatax_active_group_id', id);
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId) || (groups.length > 0 ? groups[0] : null);

  return (
    <GroupContext.Provider
      value={{
        groups,
        activeGroup,
        isLoading,
        setActiveGroupId,
        refreshGroups,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error('useGroup must be used within a GroupProvider');
  }
  return context;
};
