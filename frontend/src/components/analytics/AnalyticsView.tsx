import React from 'react';
import { GroupAnalytics, Group } from '../../types';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { DollarSign, UserCheck, Calendar, PieChart as PieIcon, TrendingUp, Layers } from 'lucide-react';

interface AnalyticsViewProps {
  analytics: GroupAnalytics;
  group: Group;
}

const COLORS = ['#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#eab308', '#64748b'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, group }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const pieData = analytics.category_breakdown.map((cat) => ({
    name: cat.category_name,
    value: cat.total_amount,
  }));

  const memberData = analytics.member_contributions.map((m) => ({
    name: m.user_name,
    Paid: m.total_paid,
    Share: m.total_share,
  }));

  return (
    <div className="space-y-6 pb-20">
      {/* Key Financial Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Total Group Expenses</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatCurrency(analytics.total_expenses)}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>This Month</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            {formatCurrency(analytics.current_month_spending)}
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs font-semibold mb-1">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>Your Paid Share</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">
            {formatCurrency(analytics.my_contribution)}
          </div>
        </div>
      </div>

      {/* Spending Over Time Chart */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-slate-100 text-base">Spending Over Time</h3>
        </div>
        {analytics.spending_trend.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.spending_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [`₹${value}`, 'Amount']}
                />
                <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
            No spending history available yet.
          </div>
        )}
      </div>

      {/* Category Breakdown & Member Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Breakdown Pie Chart */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 mb-4">
            <PieIcon className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-slate-100 text-base">Category Breakdown</h3>
          </div>

          {pieData.length > 0 ? (
            <div className="space-y-4">
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      formatter={(value: any) => [`₹${value}`, 'Expenses']}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend List */}
              <div className="space-y-2 border-t border-slate-700/50 pt-3">
                {analytics.category_breakdown.map((cat, idx) => (
                  <div key={cat.category_name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      ></span>
                      <span className="text-slate-300 font-medium">{cat.category_name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-400 font-mono">{cat.percentage}%</span>
                      <span className="font-bold text-slate-100">{formatCurrency(cat.total_amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              No categories recorded yet.
            </div>
          )}
        </div>

        {/* Member Contribution Comparison Bar Chart */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center space-x-2 mb-4">
            <Layers className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-slate-100 text-base">Member Contributions</h3>
          </div>

          {memberData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(value: any) => [`₹${value}`]}
                  />
                  <Legend />
                  <Bar dataKey="Paid" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Share" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              No member contribution data available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
