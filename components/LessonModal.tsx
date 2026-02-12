
import React, { useEffect, useState } from 'react';
import { Lesson } from '../types';

interface LessonModalProps {
  lesson: Lesson;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  isCompleted: boolean;
  onToggleComplete: (id: string) => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const LessonModal: React.FC<LessonModalProps> = ({ 
  lesson, 
  isOpen, 
  onClose, 
  onNext, 
  onPrev, 
  isCompleted, 
  onToggleComplete,
  hasPrev,
  hasNext
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
    setScrollProgress(progress);
  };

  useEffect(() => {
    setScrollProgress(0);
  }, [lesson.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative w-full max-w-6xl h-full md:h-[90vh] bg-[#020617] md:rounded-[2.5rem] overflow-hidden flex flex-col border border-white/5 shadow-2xl">
        
        {/* Header Navigation */}
        <div className="sticky top-0 z-30 w-full px-6 py-4 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={onClose}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <div className="hidden lg:flex flex-col">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">FlipZone Masterclass</span>
              <h2 className="text-sm font-bold text-white truncate max-w-md">{lesson.title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={() => onToggleComplete(lesson.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                isCompleted 
                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                : 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20 hover:bg-blue-700'
              }`}
            >
              {isCompleted ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  Dovršeno
                </>
              ) : (
                <>Označi kao naučeno</>
              )}
            </button>
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Reading Progress Bar */}
        <div className="absolute top-[68px] left-0 w-full h-[2px] bg-white/5 z-40">
           <div 
             className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] transition-all duration-100 ease-out"
             style={{ width: `${scrollProgress}%` }}
           />
        </div>

        {/* Content Section */}
        <div 
          className="flex-grow overflow-y-auto px-6 py-12 md:py-24 scroll-smooth"
          onScroll={handleScroll}
        >
          <div className="max-w-3xl mx-auto">
            <header className="mb-20 animate-in slide-in-from-bottom-8 duration-700">
               <div className="flex items-center gap-4 mb-8">
                 <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                   Modul {lesson.order}
                 </span>
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                   {lesson.duration}
                 </span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight leading-[1.1]">
                 {lesson.title}
               </h1>
               <p className="text-xl md:text-2xl text-slate-400 font-medium leading-relaxed border-l-4 border-blue-600 pl-8">
                 {lesson.description}
               </p>
            </header>

            <div className="prose prose-invert prose-blue max-w-none animate-in slide-in-from-bottom-12 duration-1000 delay-200">
              <div className="whitespace-pre-wrap text-slate-300 leading-[1.8] text-lg font-normal selection:bg-blue-500/30">
                {lesson.content}
              </div>
            </div>

            {/* Content Footer Navigation */}
            <div className="mt-32 pt-16 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Slijedi u programu:</span>
                <p className="text-white font-bold text-lg">{hasNext ? 'Sljedeća lekcija čeka' : 'Kraj Masterclassa'}</p>
              </div>

              <div className="flex gap-4 w-full sm:w-auto">
                 <button 
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className={`flex-1 sm:flex-none py-4 px-8 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    hasPrev ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-900 text-slate-700 cursor-not-allowed'
                  }`}
                >
                  Nazad
                </button>
                <button 
                  onClick={onNext}
                  disabled={!hasNext}
                  className={`flex-1 sm:flex-none py-4 px-10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    hasNext ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1' : 'bg-slate-900 text-slate-700 cursor-not-allowed'
                  }`}
                >
                  {hasNext ? 'Sljedeće' : 'Završi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
