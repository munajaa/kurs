
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

  const safeJson = async (res: Response) => {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
    const text = await res.text();
    return { message: text || "Nepoznata greška na serveru" };
  };

  const fetchAppData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      const data = await safeJson(res);
      if (res.ok) {
        if (data.lessons?.length) setLessons(data.lessons);
      } else {
        if (data.error === "DATABASE_CONFIG_ERROR") {
          setApiError({ message: "Baza nije konfigurirana", details: data.message });
        }
      }
    } catch (e) { 
      console.error("Data fetch error", e); 
    }
  }, []);

  const checkAuth = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await safeJson(res);
      if (res.ok) {
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
      interval = setInterval(() => checkAuth(token), 10000);
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

  if (apiError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md glass p-10 rounded-[2rem] text-center space-y-4 border-red-500/30">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-white">{apiError.message}</h2>
          <p className="text-slate-400 text-sm">{apiError.details}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Pokušaj ponovno</button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
             <p className="text-slate-400 font-medium">Hvala ti na prijavi, <span className="text-blue-500">@{user.nickname || user.email.split('@')[0]}</span>. Admin pregledava tvoj profil.</p>
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
        <div className="text-center py-20">
          <h2 className="text-6xl font-black text-white mb-6">Dobrodošli nazad!</h2>
          <button onClick={() => setActiveView('lessons')} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20">Kreni s učenjem</button>
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
            <h1 className="text-lg font-black text-white uppercase tracking-tighter">FlipZone</h1>
          </div>
          <nav className="flex items-center gap-2">
            <button onClick={() => setActiveView('lessons')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${activeView === 'lessons' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Akademija</button>
            <button onClick={() => setActiveView('chat')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${activeView === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Chat</button>
            {user.role === 'admin' && <button onClick={() => setActiveView('admin')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${activeView === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>Admin</button>}
            <button onClick={logout} className="p-2 text-red-500 ml-4"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
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
