import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'analytics';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 animate-pulse space-y-4">
        <div className="h-4 bg-slate-700/60 rounded w-1/3"></div>
        <div className="h-10 bg-slate-700/60 rounded w-1/2"></div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-12 bg-slate-700/60 rounded-xl"></div>
          <div className="h-12 bg-slate-700/60 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-800/40 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 w-full">
            <div className="w-10 h-10 rounded-xl bg-slate-700/60"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-700/60 rounded w-1/3"></div>
              <div className="h-3 bg-slate-700/60 rounded w-1/4"></div>
            </div>
          </div>
          <div className="h-6 bg-slate-700/60 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
};
