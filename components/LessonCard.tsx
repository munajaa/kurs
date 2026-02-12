
import React from 'react';
import { Lesson } from '../types';

interface LessonCardProps {
  lesson: Lesson;
  isCompleted: boolean;
  onClick: (lesson: Lesson) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, isCompleted, onClick }) => {
  return (
    <div 
      onClick={() => onClick(lesson)}
      className="lesson-card group cursor-pointer overflow-hidden rounded-3xl relative flex flex-col h-full"
    >
      {/* Visual Thumbnail Section */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-900 flex items-center justify-center p-8 select-none border-b border-white/5">
        {/* Abstract Background Design */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-transparent to-transparent opacity-50" />
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none">
             {/* Subtle Grid Pattern */}
             <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          </div>
        </div>
        
        {/* Poster Content */}
        <div className="relative z-10 text-center">
          <div className="inline-block px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-[9px] font-black tracking-[0.3em] text-blue-400 mb-6 uppercase">
            FlipZone Masterclass
          </div>
          <h4 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-4 group-hover:scale-105 transition-transform duration-500 ease-out">
            {lesson.title.split('–').pop()?.trim()}
          </h4>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 bg-blue-500/50" />
            <span className="text-[11px] font-bold text-slate-500 tracking-widest uppercase">
              Modul {lesson.order < 10 ? `0${lesson.order}` : lesson.order}
            </span>
            <div className="h-[1px] w-8 bg-blue-500/50" />
          </div>
        </div>

        {/* Tags */}
        <div className="absolute top-4 left-4 flex gap-2">
           <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-[10px] font-bold text-blue-400 rounded-lg border border-white/5 uppercase tracking-wider">
             {lesson.category}
           </span>
        </div>

        {/* Completion Badge */}
        {isCompleted && (
          <div className="absolute top-4 right-4 animate-in zoom-in duration-300">
            <div className="bg-green-500/90 backdrop-blur-md p-1.5 rounded-full border border-green-400/50 shadow-lg shadow-green-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* Bottom Metadata */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
          <span>{lesson.duration}</span>
          <span className="group-hover:text-blue-400 transition-colors">Pročitaj Modul →</span>
        </div>

        {/* Animated Reveal Background */}
        <div className="absolute inset-0 bg-blue-600 mix-blend-overlay opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-slate-100 mb-3 group-hover:text-blue-400 transition-colors line-clamp-1">
           {lesson.title}
        </h3>
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
          {lesson.description}
        </p>
      </div>
    </div>
  );
};
