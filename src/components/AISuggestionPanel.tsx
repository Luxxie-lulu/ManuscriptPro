import React from 'react';
import { Sparkles, Check, X, Info, Loader2 } from 'lucide-react';
import { AISuggestion } from '../services/geminiService';
import { cn } from '../lib/utils';

interface AISuggestionPanelProps {
  suggestions: AISuggestion[];
  onAccept: (suggestion: AISuggestion) => void;
  onReject: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({
  suggestions,
  onAccept,
  onReject,
  loading,
  onRefresh
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#A49B8B] flex items-center gap-2">
          <Sparkles size={14} className="text-blue-500" />
          AI Insights
        </h3>
        <button 
          onClick={onRefresh}
          disabled={loading}
          className="text-[10px] font-bold text-editorial-text uppercase hover:underline disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Scan Chapter'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-editorial-accent">
          <Loader2 className="animate-spin mb-2" size={24} />
          <p className="text-xs italic">Reviewing your prose...</p>
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="text-center py-8 px-4 border border-dashed border-editorial-border rounded-xl bg-editorial-sidebar/50">
          <p className="text-xs text-editorial-accent italic">Select a chapter and click "Scan" for specialized editorial feedback.</p>
        </div>
      )}

      {!loading && suggestions.map((suggestion) => (
        <div 
          key={suggestion.id}
          className="p-4 bg-white border border-editorial-border rounded-xl shadow-sm space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className={cn(
              "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
              suggestion.type === 'phrasing' ? "bg-blue-50 text-blue-600" :
              suggestion.type === 'continuity' ? "bg-orange-50 text-orange-600" :
              suggestion.type === 'character' ? "bg-purple-50 text-purple-600" : "bg-slate-50 text-slate-600"
            )}>
              {suggestion.type}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onAccept(suggestion)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check size={14} />
              </button>
              <button 
                onClick={() => onReject(suggestion.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative pl-3 border-l-2 border-slate-100 italic text-xs text-slate-400">
              "{suggestion.originalText.length > 60 ? suggestion.originalText.substring(0, 60) + '...' : suggestion.originalText}"
            </div>
            <div className="text-sm font-serif font-medium text-editorial-text leading-relaxed">
              {suggestion.suggestedText}
            </div>
          </div>

          <div className="pt-2 flex items-start gap-2 border-t border-slate-50">
            <Info size={12} className="shrink-0 mt-0.5 text-editorial-accent" />
            <p className="text-[11px] text-editorial-accent leading-normal italic">
              {suggestion.explanation}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
