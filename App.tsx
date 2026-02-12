
import React, { useState, useEffect, useCallback } from 'react';
import { LESSONS_DATA as STATIC_LESSONS } from './data/lessons';
import { SUPPLIERS_DATA as STATIC_SUPPLIERS } from './data/suppliers';
import { ANNOUNCEMENTS_DATA } from './data/announcements';
import { USEFUL_DATA as STATIC_USEFUL } from './data/useful';
import { Lesson, UserProgress, View, UsefulItem, User, Supplier } from './types';
import { LessonCard } from './components/LessonCard';
import { LessonModal } from './components/LessonModal';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { UsefulModal } from './components/UsefulModal';
import { Chat } from './components/Chat';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeUsefulItem, setActiveUsefulItem] = useState<UsefulItem | null>(null);
  const [progress, setProgress] = useState<UserProgress>({ completedLessonIds: [] });
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('flipzone_token'));
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [lessons, setLessons] = useState<Lesson[]>(STATIC_LESSONS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(STATIC_SUPPLIERS);
  const [useful, setUseful] = useState<UsefulItem[]>(STATIC_USEFUL);

  const fetchAppData = useCallback(async () => {
    try {
      const res = await fetch('/.netlify/functions/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.lessons?.length) setLessons(data.lessons);
        if (data.suppliers?.length) setSuppliers(data.suppliers);
        if (data.useful?.length) setUseful(data.useful);
      }
    } catch (e) { console.error("Failed to fetch dynamic data", e); }
  }, []);

  const checkAuth = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/.netlify/functions/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        logout();
      }
    } catch (e) {
      logout();
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      checkAuth(token);
    } else {
      setIsInitializing(false);
    }
    fetchAppData();
  }, [token, fetchAppData, checkAuth]);

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

  useEffect(() => {
    const savedProgress = localStorage.getItem('flipzone_progress');
    if (savedProgress) {
      try { setProgress(JSON.parse(savedProgress)); } catch (e) { console.error(e); }
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

  const completionPercentage = Math.round((progress.completedLessonIds.length / lessons.length) * 100);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Mandatory Login
  if (!user) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <Login onLogin={login} />
      </div>
    );
  }

  // Waiting for Approval Screen
  if (!user.isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="max-w-md glass p-12 rounded-[3rem] space-y-8 animate-in fade-in zoom-in duration-700">
           <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto border border-yellow-500/20">
             <svg className="w-10 h-10 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
           </div>
           <div className="space-y-4">
             <h2 className="text-3xl font-black text-white tracking-tight">Pristup na čekanju</h2>
             <p className="text-slate-400 font-medium">Hvala ti na registraciji, <span className="text-white">@{user.nickname || user.email.split('@')[0]}</span>. Tvoj zahtjev je poslan adminu na odobrenje.</p>
           </div>
           <button onClick={logout} className="text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest underline decoration-2 underline-offset-8">Odjavi se</button>
        </div>
      </div>
    );
  }

  const renderHome = () => (
    <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-8">
        <div className="inline-block px-4 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-widest animate-bounce">
          Premium Access Active
        </div>
        <h2 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-none">
          FlipZone <span className="text-blue-500">Hub</span>
        </h2>
        <p className="text-slate-400 text-xl md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
          Ekskluzivna zajednica za ozbiljne resellere. Tvoj put do financijske slobode kreće ovdje.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div onClick={() => setActiveView('lessons')} className="lesson-card p-10 rounded-[2.5rem] cursor-pointer group glass transition-all duration-500">
          <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Masterclass</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">Nauči sustav i skrati put do profita. ({completionPercentage}% završeno)</p>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)] transition-all duration-1000" style={{ width: `${completionPercentage}%` }} />
          </div>
        </div>

        <div onClick={() => setActiveView('suppliers')} className="lesson-card p-10 rounded-[2.5rem] cursor-pointer group glass transition-all duration-500">
          <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-purple-600 group-hover:text-white transition-all text-purple-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 11V7a4 4 0 118 0m-3.359 6h1.91c.606 0 1.144.33 1.41.863l1.523 3.047A1.5 1.5 0 0122.13 22H1.87a1.5 1.5 0 01-1.344-2.09l1.523-3.047A1.5 1.5 0 013.449 16h1.91m11.282 0l-1.91-3.82a1.5 1.5 0 00-1.344-.863H10.62a1.5 1.5 0 00-1.344.863L7.366 16m9.366 0H7.366m9.366 0v5a2 2 0 01-2 2H9.268a2 2 0 01-2-2v-5" /></svg>
          </div>
          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Dobavljači</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">Provjereni kontakti za brzu rotaciju kapitala bez rizika.</p>
          <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest group-hover:text-white transition-colors">Istraži Katalog →</span>
        </div>

        <div onClick={() => setActiveView('chat')} className="lesson-card p-10 rounded-[2.5rem] cursor-pointer group glass transition-all duration-500">
          <div className="w-14 h-14 bg-emerald-600/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all text-emerald-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Zajednica</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">Pitaj, uči i dijeli iskustva s ostalim članovima u realnom vremenu.</p>
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#010409] bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">U{i}</div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-[#010409] bg-emerald-600 flex items-center justify-center text-[8px] font-bold text-white">+12</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveView = () => {
    if (activeView === 'admin' && user?.role === 'admin') return <AdminDashboard token={token!} onUpdate={fetchAppData} />;
    if (activeView === 'chat') return <Chat user={user} token={token} onAuthRedirect={() => setActiveView('login')} />;
    
    switch (activeView) {
      case 'lessons': return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">Masterclass <span className="text-blue-500">Akademija</span></h2>
            <p className="text-slate-500 max-w-xl mx-auto">Svaki modul je korak bliže tvojem cilju. Kreni redom.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {lessons.map((lesson, idx) => (
              <div key={lesson.id} style={{ animationDelay: `${idx * 100}ms` }} className="animate-in fade-in slide-in-from-bottom-12 duration-700">
                <LessonCard 
                  lesson={lesson} 
                  isCompleted={progress.completedLessonIds.includes(lesson.id)}
                  onClick={setActiveLesson}
                />
              </div>
            ))}
          </div>
        </div>
      );
      case 'suppliers': return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white">Elite <span className="text-blue-500">Suppliers</span></h2>
            <p className="text-slate-500 mt-4">Provjereni batch-evi s direktnim kontaktima.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {suppliers.map(s => (
              <div key={s.id} className="lesson-card rounded-[2.5rem] overflow-hidden flex flex-col group glass">
                <div className="aspect-square bg-white flex items-center justify-center p-12 relative">
                  <img src={s.imageUrl} alt={s.productName} className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-6 left-6 px-3 py-1 bg-black text-white text-[9px] font-black rounded-full uppercase tracking-widest">{s.name}</div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-white mb-2">{s.productName}</h3>
                  <p className="text-slate-500 text-sm mb-8 flex-grow leading-relaxed">{s.description}</p>
                  <a href={s.buyLink} target="_blank" className="btn-primary py-4 px-6 rounded-2xl font-black text-center text-xs uppercase tracking-widest">
                    {s.isWhatsApp ? 'WhatsApp Narudžba' : 'Naruči Odmah'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      case 'announcements': return (
        <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {ANNOUNCEMENTS_DATA.map(a => (
            <div key={a.id} className="lesson-card p-10 rounded-[2.5rem] glass">
               <div className="flex flex-col md:flex-row gap-10">
                {a.imageUrl && <img src={a.imageUrl} className="w-full md:w-48 h-48 object-cover rounded-3xl shadow-2xl" alt="" />}
                <div className="flex-1 space-y-5">
                  <span className="text-blue-500 font-black text-xs uppercase tracking-widest">{a.date}</span>
                  <h3 className="text-3xl font-black text-white tracking-tight">{a.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{a.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
      case 'invoices': return <InvoiceGenerator />;
      case 'useful': return (
        <div className="max-w-5xl mx-auto space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useful.map(item => (
              <div key={item.id} onClick={() => setActiveUsefulItem(item)} className="lesson-card p-10 rounded-[2.5rem] border-l-8 border-l-blue-600 cursor-pointer glass">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full">{item.category}</span>
                <h3 className="text-2xl font-black text-white my-5 tracking-tight">{item.title}</h3>
                <p className="text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
      default: return renderHome();
    }
  };

  return (
    <div className="min-h-screen relative pb-32">
      <header className="sticky top-0 z-50 glass border-b border-white/5 no-print">
        <div className="max-w-7xl mx-auto px-6 h-20 md:h-24 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-4 cursor-pointer group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-blue-600/30 group-hover:scale-110 transition-transform text-white">F</div>
            <div className="hidden sm:flex flex-col">
              <h1 className="text-lg font-black text-white tracking-tighter uppercase">FlipZone</h1>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Balkan</span>
            </div>
          </div>

          <nav className="flex items-center gap-1 md:gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            {[
              { id: 'home', label: 'Home' },
              { id: 'lessons', label: 'Akademija' },
              { id: 'suppliers', label: 'Vendor' },
              { id: 'useful', label: 'Korisno' },
              { id: 'chat', label: 'Chat' },
              { id: 'invoices', label: 'Invoices' },
              ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin' }] : [])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as View)}
                className={`px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeView === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button onClick={logout} className="p-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-all" title="Izlaz">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-16 md:pt-24">
        {renderActiveView()}
      </main>

      <footer className="mt-40 pt-20 pb-20 border-t border-white/5 no-print">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <p className="text-slate-600 text-[10px] tracking-[0.5em] uppercase font-black">FlipZone Balkan Hub © 2026</p>
        </div>
      </footer>

      {activeLesson && (
        <LessonModal 
          lesson={activeLesson} isOpen={!!activeLesson} onClose={() => setActiveLesson(null)}
          onNext={() => { const idx = lessons.findIndex(l => l.id === activeLesson.id); if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1]); }}
          onPrev={() => { const idx = lessons.findIndex(l => l.id === activeLesson.id); if (idx > 0) setActiveLesson(lessons[idx - 1]); }}
          hasNext={lessons.findIndex(l => l.id === activeLesson.id) < lessons.length - 1}
          hasPrev={lessons.findIndex(l => l.id === activeLesson.id) > 0}
          isCompleted={progress.completedLessonIds.includes(activeLesson.id)}
          onToggleComplete={toggleComplete}
        />
      )}

      {activeUsefulItem && <UsefulModal item={activeUsefulItem} isOpen={!!activeUsefulItem} onClose={() => setActiveUsefulItem(null)} />}
    </div>
  );
};

export default App;
