import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Group } from '../../types';
import { apiClient } from '../../api/client';
import { MessageSquare, Sparkles, Send } from 'lucide-react';

interface AIQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
}

export const AIQueryModal: React.FC<AIQueryModalProps> = ({ isOpen, onClose, group }) => {
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  const sampleQuestions = [
    'Who owes whom?',
    'What was our biggest expense?',
    'How much did we spend on food?',
    'How much has been spent total?',
  ];

  const handleAsk = async (questionText: string) => {
    setQuery(questionText);
    setIsQuerying(true);
    setAnswer(null);

    try {
      const res = await apiClient.post(`/groups/${group.id}/ai/query`, { query: questionText });
      setAnswer(res.data.answer);
    } catch {
      setAnswer('Unable to process query. Please check your network connection.');
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Financial Assistant">
      <div className="space-y-4">
        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span>Ask natural language questions about your shared ledger:</span>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim()) handleAsk(query.trim());
          }}
          className="flex space-x-2"
        >
          <input
            type="text"
            placeholder="Type your question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={isQuerying || !query.trim()}
            className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold shadow flex items-center space-x-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Answer Output */}
        {isQuerying && (
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-400 animate-pulse">
            Analyzing ledger database records...
          </div>
        )}

        {answer && !isQuerying && (
          <div className="p-4 bg-teal-950/30 border border-teal-500/30 rounded-xl space-y-1">
            <span className="text-[11px] font-bold uppercase text-teal-400 block">AI Response</span>
            <p className="text-sm font-medium text-slate-100 leading-relaxed">{answer}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
