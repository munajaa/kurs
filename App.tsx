
import React, { useState, useEffect, useCallback } from 'react';
import { LESSONS_DATA as STATIC_LESSONS } from './data/lessons';
import { Lesson, UserProgress, View, User } from './types';
import { LessonCard } from './components/LessonCard';
import { LessonModal } from './components/LessonModal';
import { Chat } from './components/Chat';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress>({ completedLessonIds: [] });
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('flipzone_token'));
  const [isInitializing, setIsInitializing] = useState(true);
  const [apiError, setApiError] = useState<{message: string, details?: string} | null>(null);
  
  const [lessons, setLessons] = useState<Lesson[]>(STATIC_LESSONS);

  // Potpuno sigurno parsiranje JSON-a koje ne zatvara stream prerano
  const safeJson = async (res: Response) => {
    try {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return { message: text || "Prazan odgovor servera" };
      }
    } catch (e) {
      return { message: "Neuspješno čitanje odgovora" };
    }
  };

  const fetchAppData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      const data = await safeJson(res);
      if (res.ok) {
        if (data && data.lessons && Array.isArray(data.lessons)) {
          setLessons(data.lessons.length > 0 ? data.lessons : STATIC_LESSONS);
        }
      }
    } catch (e) { 
      console.error("Data fetch error", e); 
    }
  }, []);

  const checkAuth = useCallback(async (authToken: string) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await safeJson(res);
      if (res.ok && data.id) {
        setUser(data);
      } else if (res.status === 401) {
        logout();
      }
    } catch (e) {
      console.error("Auth check failed", e);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (token) {
        await checkAuth(token);
      } else {
        setIsInitializing(false);
      }
      await fetchAppData();
    };
    init();
  }, [token, fetchAppData, checkAuth]);

  useEffect(() => {
    let interval: any;
    if (user && !user.isApproved && token) {
      interval = setInterval(() => checkAuth(token), 15000);
    }
    return () => clearInterval(interval);
  }, [user, token, checkAuth]);

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('flipzone_token', userToken);
    setActiveView('home');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('flipzone_token');
    setActiveView('home');
  };

  const toggleComplete = (lessonId: string) => {
    const newCompleted = progress.completedLessonIds.includes(lessonId)
      ? progress.completedLessonIds.filter(id => id !== lessonId)
      : [...progress.completedLessonIds, lessonId];
    setProgress({ completedLessonIds: newCompleted });
    localStorage.setItem('flipzone_progress', JSON.stringify({ completedLessonIds: newCompleted }));
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Inicijalizacija Hub-a...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <Login onLogin={login} />
      </div>
    );
  }

  if (!user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md glass p-12 rounded-[3rem] space-y-8 animate-in fade-in zoom-in duration-700">
           <div className="relative mx-auto w-24 h-24">
             <div className="absolute inset-0 bg-yellow-500/20 rounded-full animate-ping"></div>
             <div className="relative w-24 h-24 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/30">
               <svg className="w-12 h-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
           </div>
           <div className="space-y-4">
             <h2 className="text-3xl font-black text-white tracking-tight">Pristup na čekanju</h2>
             <p className="text-slate-400 font-medium">Pozdrav, <span className="text-blue-500">@{user.nickname || user.email.split('@')[0]}</span>. Vaš račun čeka odobrenje admina. Provjera se vrši automatski svakih 15 sekundi.</p>
           </div>
           <button onClick={logout} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest underline decoration-2 underline-offset-8 transition-all">Odjavi se</button>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    if (activeView === 'admin' && user?.role === 'admin') return <AdminDashboard token={token!} onUpdate={fetchAppData} />;
    if (activeView === 'chat') return <Chat user={user} token={token} onAuthRedirect={() => setActiveView('login')} />;
    
    switch (activeView) {
      case 'lessons': return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-white">Masterclass <span className="text-blue-500">Akademija</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Svi moduli su otključani. Krenite redom za najbolje rezultate.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {lessons.map((lesson) => (
              <LessonCard 
                key={lesson.id}
                lesson={lesson} 
                isCompleted={progress.completedLessonIds.includes(lesson.id)}
                onClick={setActiveLesson}
              />
            ))}
          </div>
        </div>
      );
      default: return (
        <div className="text-center py-20 flex flex-col items-center">
          <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-5xl font-black mb-10 shadow-2xl shadow-blue-600/20">F</div>
          <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter">Dobrodošli u <span className="text-blue-500">Hub</span>.</h2>
          <p className="text-slate-500 text-lg mb-12 max-w-lg">Sustav je spreman. Svi alati i znanje koje trebate su na dohvat ruke.</p>
          <div className="flex gap-4">
            <button onClick={() => setActiveView('lessons')} className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition-all hover:-translate-y-1">Akademija</button>
            <button onClick={() => setActiveView('chat')} className="px-10 py-5 bg-white/5 text-white rounded-2xl font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">Zajednica</button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen relative pb-32">
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-4 cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl text-white">F</div>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter hidden sm:block">FlipZone</h1>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <button onClick={() => setActiveView('lessons')} className={`px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all ${activeView === 'lessons' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Akademija</button>
            <button onClick={() => setActiveView('chat')} className={`px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all ${activeView === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Chat</button>
            {user.role === 'admin' && <button onClick={() => setActiveView('admin')} className={`px-3 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase transition-all ${activeView === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Admin</button>}
            <button onClick={logout} className="p-2 text-red-500/50 hover:text-red-500 ml-2 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-16">
        {renderActiveView()}
      </main>

      {activeLesson && (
        <LessonModal 
          lesson={activeLesson} isOpen={!!activeLesson} onClose={() => setActiveLesson(null)}
          onNext={() => {}} onPrev={() => {}} hasNext={false} hasPrev={false}
          isCompleted={progress.completedLessonIds.includes(activeLesson.id)}
          onToggleComplete={toggleComplete}
        />
      )}
    </div>
  );
};

export default App;
