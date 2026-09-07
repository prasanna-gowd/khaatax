import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Category, Group } from '../../types';
import { apiClient } from '../../api/client';
import { Sparkles, Mic, MicOff, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AIQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  categories: Category[];
  onConfirmSave: (payload: any) => Promise<void>;
}

export const AIQuickAddModal: React.FC<AIQuickAddModalProps> = ({
  isOpen,
  onClose,
  group,
  categories,
  onConfirmSave,
}) => {
  const [promptText, setPromptText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Web Speech API Voice Recognition (Requirement 45)
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Voice input is not supported in this browser. Please type your prompt.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPromptText(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!promptText.trim()) return;

    setIsParsing(true);
    try {
      const res = await apiClient.post(`/groups/${group.id}/ai/parse-text`, {
        text: promptText.trim(),
      });
      setParsedResult(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to parse text. Try entering standard transaction.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveConfirmed = async () => {
    if (!parsedResult) return;
    try {
      await onConfirmSave({
        amount: parsedResult.amount,
        transaction_type: parsedResult.transaction_type,
        description: parsedResult.description,
        category_id: parsedResult.category_id,
        paid_by: parsedResult.paid_by,
        split_type: parsedResult.split_type,
        transaction_date: parsedResult.transaction_date,
      });
      setParsedResult(null);
      setPromptText('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save confirmed transaction');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Smart Expense Entry">
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {!parsedResult ? (
          <form onSubmit={handleParse} className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
              <Sparkles className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Type or speak naturally: e.g. "I paid 650 for dinner yesterday"</span>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                placeholder="e.g. Paid ₹900 for groceries or Rahul paid 1200 electricity bill..."
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 pr-12"
              />
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`absolute right-3 top-3 p-2 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
                title="Voice Dictation"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isParsing || !promptText.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isParsing ? 'Parsing with AI...' : 'Extract Transaction'}</span>
            </button>
          </form>
        ) : (
          /* Confirmation Preview Modal Step (Requirement 44: "Never automatically save unconfirmed AI output") */
          <div className="space-y-4">
            <div className="bg-slate-800 border border-emerald-500/40 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase">
                <span>Extracted Draft</span>
                <span className="text-emerald-400 font-bold">{Math.round(parsedResult.confidence * 100)}% Confidence</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block font-medium">Description</label>
                <input
                  type="text"
                  value={parsedResult.description}
                  onChange={(e) => setParsedResult({ ...parsedResult, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-bold text-sm mt-0.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block font-medium">Amount (₹)</label>
                  <input
                    type="number"
                    value={parsedResult.amount}
                    onChange={(e) => setParsedResult({ ...parsedResult, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-emerald-400 font-bold text-sm mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block font-medium">Category</label>
                  <select
                    value={parsedResult.category_id}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.target.value);
                      setParsedResult({ ...parsedResult, category_id: e.target.value, category_name: cat?.name });
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs mt-0.5"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setParsedResult(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Re-try Prompt
              </button>
              <button
                onClick={handleSaveConfirmed}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Save</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
