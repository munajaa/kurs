
import React from 'react';
import { UsefulItem } from '../types';

interface UsefulModalProps {
  item: UsefulItem;
  isOpen: boolean;
  onClose: () => void;
}

export const UsefulModal: React.FC<UsefulModalProps> = ({ item, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">{item.category}</span>
            <h2 className="text-2xl md:text-3xl font-black text-white">{item.title}</h2>
          </div>
          <button onClick={onClose} className="p-3 text-slate-400 hover:text-white bg-white/5 rounded-2xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
          
          {/* Image Gallery */}
          {item.images && item.images.length > 0 && (
            <div className={`grid gap-4 ${item.images.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {item.images.map((img, idx) => (
                <div key={idx} className="relative aspect-video md:aspect-square rounded-3xl overflow-hidden border border-white/5 group">
                  <img 
                    src={img} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt={`${item.title} vizual ${idx + 1}`} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}

          {/* Text Content */}
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-lg font-medium selection:bg-purple-500/30">
              {item.content}
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-8 border-t border-white/5">
            <div className="bg-purple-600/10 border border-purple-500/20 p-6 rounded-3xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">Reseller Savjet</h4>
                <p className="text-slate-400 text-sm">Ove informacije su prikupljene iz stvarnog iskustva naših najuspješnijih članova u 2026. godini.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.4); }
      `}</style>
    </div>
  );
};
