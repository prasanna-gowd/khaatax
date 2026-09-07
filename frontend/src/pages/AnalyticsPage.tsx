import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGroup } from '../context/GroupContext';
import { apiClient } from '../api/client';
import { GroupAnalytics } from '../types';

import { Header } from '../components/common/Header';
import { Navbar } from '../components/common/Navbar';
import { AnalyticsView } from '../components/analytics/AnalyticsView';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { PieChart } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { activeGroup } = useGroup();

  const { data: analytics, isLoading } = useQuery<GroupAnalytics>({
    queryKey: ['analytics', activeGroup?.id],
    queryFn: async () => {
      const res = await apiClient.get<GroupAnalytics>(`/groups/${activeGroup?.id}/analytics`);
      return res.data;
    },
    enabled: !!activeGroup,
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16 md:pb-0">
      <Header />
      <div className="max-w-4xl mx-auto px-4 w-full flex-1 pt-6">
        <Navbar />

        <main className="space-y-5 mt-4 pb-12">
          <div>
            <h2 className="text-2xl font-black text-white">Financial Analytics</h2>
            <p className="text-xs text-slate-400">Spending insights, category breakdowns, and member contributions.</p>
          </div>

          {isLoading ? (
            <LoadingSkeleton type="card" />
          ) : analytics ? (
            <AnalyticsView analytics={analytics} group={activeGroup!} />
          ) : (
            <EmptyState
              icon={PieChart}
              title="Analytics Unavailable"
              description="Record expenses to view spending breakdowns and analytics."
            />
          )}
        </main>
      </div>
    </div>
  );
};
