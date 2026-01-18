import React, { useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';

interface FormulaGeneratorProps {
  onClose: () => void;
  onGenerate: (description: string) => Promise<void>;
  targetCell: string;
}

export const FormulaGenerator: React.FC<FormulaGeneratorProps> = ({ onClose, onGenerate, targetCell }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    await onGenerate(prompt);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-gray-200 animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles size={20} />
            AI Formula Generator
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-gray-600 text-sm mb-4">
            Describe what you want to calculate in cell <span className="font-mono font-bold text-gray-800 bg-gray-100 px-1 rounded">{targetCell}</span>.
          </p>
          
          <textarea
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none mb-4 shadow-sm"
            rows={3}
            placeholder="e.g., 'Sum of Sales column' or 'Subtract Cost from Price'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            autoFocus
          />

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? 'Generating...' : (
                <>
                  Generate Formula <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};