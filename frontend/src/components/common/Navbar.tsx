import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Receipt, PieChart, Settings } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'Analytics', path: '/analytics', icon: PieChart },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur border-t border-slate-800 md:relative md:border-t-0 md:bg-transparent md:py-4">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-around md:justify-start md:space-x-2 py-2 md:py-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-2.5 px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                    isActive
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
