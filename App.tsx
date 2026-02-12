
import React, { useState, useEffect } from 'react';
import { LESSONS_DATA } from './data/lessons';
import { Lesson, UserProgress } from './types';
import { LessonCard } from './components/LessonCard';
import { LessonModal } from './components/LessonModal';

const App: React.FC = () => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress>({ completedLessonIds: [] });
  const [filter, setFilter] = useState<string>('Sve');

  useEffect(() => {
    const savedProgress = localStorage.getItem('flipzone_progress');
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.error('Progress Load Error', e);
      }
    }
  }, []);

  const saveProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    localStorage.setItem('flipzone_progress', JSON.stringify(newProgress));
  };

  const toggleComplete = (lessonId: string) => {
    const newCompleted = progress.completedLessonIds.includes(lessonId)
      ? progress.completedLessonIds.filter(id => id !== lessonId)
      : [...progress.completedLessonIds, lessonId];
    
    saveProgress({ completedLessonIds: newCompleted });
  };

  const categories = ['Sve', ...Array.from(new Set(LESSONS_DATA.map(l => l.category)))];
  const filteredLessons = filter === 'Sve' 
    ? LESSONS_DATA 
    : LESSONS_DATA.filter(l => l.category === filter);

  const currentIndex = activeLesson ? LESSONS_DATA.findIndex(l => l.id === activeLesson.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < LESSONS_DATA.length - 1;

  const navigateTo = (direction: 'next' | 'prev') => {
    if (direction === 'next' && hasNext) {
      setActiveLesson(LESSONS_DATA[currentIndex + 1]);
    } else if (direction === 'prev' && hasPrev) {
      setActiveLesson(LESSONS_DATA[currentIndex - 1]);
    }
  };

  const totalLessons = LESSONS_DATA.length;
  const completedCount = progress.completedLessonIds.length;
  const completionPercentage = Math.round((completedCount / totalLessons) * 100);

  return (
    <div className="min-h-screen relative pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#020617]/60 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(59,130,246,0.5)]">
              F
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-[-0.05em] text-white">
                FLIPZONE <span className="text-blue-500">BALKAN</span>
              </h1>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Masterclass Hub</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10">
             <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tvoj Napredak</span>
                  <span className="text-sm font-black text-blue-500">{completionPercentage}%</span>
                </div>
                <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)] transition-all duration-1000"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
             </div>
             <div className="h-10 w-[1px] bg-white/10" />
             <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Naučeno</span>
                <span className="text-lg font-black text-white">{completedCount}/{totalLessons}</span>
             </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 md:pt-24">
        <section className="text-center mb-24 animate-in fade-in slide-in-from-top-12 duration-1000">
           <div className="inline-block px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-10">
             Ekskluzivni Trening Program
           </div>
           <h2 className="text-5xl md:text-8xl font-black text-white mb-10 tracking-[-0.04em] leading-[0.95] drop-shadow-2xl">
             Postani <span className="text-blue-500">Operater</span>, <br />Ne Samo Reseller.
           </h2>
           <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed mb-12">
             Najopširniji program na Balkanu za skaliranje reselling biznisa. 
             Pretvori nagađanje u stabilan, predvidljiv sistem.
           </p>

           {/* Filter Bar */}
           <div className="flex flex-wrap justify-center gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-8 py-3 rounded-2xl text-[11px] font-black tracking-widest transition-all duration-300 border ${
                    filter === cat 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-600/30 -translate-y-1' 
                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
           </div>
        </section>

        {/* Lessons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredLessons.map((lesson, idx) => (
            <div 
              key={lesson.id} 
              className="animate-in fade-in slide-in-from-bottom-12 duration-700"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <LessonCard 
                lesson={lesson} 
                isCompleted={progress.completedLessonIds.includes(lesson.id)}
                onClick={setActiveLesson}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredLessons.length === 0 && (
          <div className="text-center py-32 rounded-[3rem] border-2 border-dashed border-white/5 bg-white/2">
            <h3 className="text-2xl font-black text-slate-600 uppercase tracking-widest">Nema lekcija</h3>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-40 pt-20 pb-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center font-black text-3xl mb-8 shadow-2xl shadow-blue-600/40">F</div>
          <p className="text-slate-500 font-bold text-sm mb-2 tracking-widest uppercase">FlipZone Balkan © 2024</p>
          <p className="text-slate-700 text-xs tracking-tighter uppercase font-black">Design by Elite AI Engineer</p>
        </div>
      </footer>

      {/* Lesson Modal Reader */}
      {activeLesson && (
        <LessonModal 
          lesson={activeLesson}
          isOpen={!!activeLesson}
          onClose={() => setActiveLesson(null)}
          onNext={() => navigateTo('next')}
          onPrev={() => navigateTo('prev')}
          hasNext={hasNext}
          hasPrev={hasPrev}
          isCompleted={progress.completedLessonIds.includes(activeLesson.id)}
          onToggleComplete={toggleComplete}
        />
      )}
    </div>
  );
};

export default App;
