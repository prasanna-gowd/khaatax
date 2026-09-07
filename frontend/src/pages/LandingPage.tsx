import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, ArrowRight, ShieldCheck, Zap, Users, Receipt, Handshake } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <header className="px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-emerald-500/20">
            K
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            Khaata<span className="text-emerald-400">X</span>
          </span>
        </div>

        <div>
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 text-sm transition-all hover:scale-105"
            >
              Dashboard →
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-sm border border-slate-700 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-12 text-center space-y-8 my-auto">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-400">
          <Zap className="w-4 h-4" />
          <span>Real-time Shared Financial Ledger for 2 People</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Your shared <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            money ledger.
          </span>
        </h1>

        <p className="text-slate-400 text-lg sm:text-xl max-w-xl mx-auto font-normal">
          Track shared expenses, payments and balances together seamlessly with roommates, partners, or friends.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
          <button
            onClick={() => navigate(isAuthenticated ? '/create-group' : '/auth?redirect=create-group')}
            className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-extrabold px-7 py-4 rounded-2xl text-base shadow-xl shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            <span>+ Create Group</span>
          </button>

          <button
            onClick={() => navigate(isAuthenticated ? '/join-group' : '/auth?redirect=join-group')}
            className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold px-7 py-4 rounded-2xl text-base border border-slate-700 shadow-xl transition-all transform hover:-translate-y-0.5"
          >
            <span>→ Join Group</span>
          </button>
        </div>

        {/* How It Works Section */}
        <div className="pt-16 border-t border-slate-800/80">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-8">
            How KhaataX Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">1. Create or Join Group</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                One person creates a group and gets a 6-character code. The second person enters the code to join the shared ledger.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-lg">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">2. Record Expenses</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add transactions using "+ I Paid" or "↑ I Received". Choose 50/50, Full, or Custom splits.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg">
                <Handshake className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">3. Automatic Balance & Settle</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                KhaataX calculates exact net debt in real-time. Click "Settle Up" whenever you pay back to clear balances.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
        <p>KhaataX © 2026 — Your shared money ledger.</p>
      </footer>
    </div>
  );
};
