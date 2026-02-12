
import React, { useState, useEffect, useCallback } from 'react';
import { Lesson, User, Supplier, Announcement, UsefulItem, View } from './types';
import { LessonCard } from './components/LessonCard';
import { LessonModal } from './components/LessonModal';
import { Chat } from './components/Chat';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { UsefulModal } from './components/UsefulModal';
import { Profile } from './components/Profile';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeUseful, setActiveUseful] = useState<UsefulItem | null>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('flipzone_token'));
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [usefulItems, setUsefulItems] = useState<UsefulItem[]>([]);

  const fetchAppData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        setLessons(data.lessons || []);
        setSuppliers(data.suppliers || []);
        setAnnouncements(data.announcements || []);
        setUsefulItems(data.useful || []);
      }
    } catch (e) { console.error("Data fetch error", e); }
  }, []);

  const verifyUser = useCallback(async () => {
    if (!token) {
      setIsInitializing(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        localStorage.removeItem('flipzone_token');
        setToken(null);
      }
    } catch (e) { console.error(e); }
    finally { setIsInitializing(false); }
  }, [token]);

  useEffect(() => {
    fetchAppData();
    verifyUser();
  }, [fetchAppData, verifyUser]);

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('flipzone_token', userToken);
    setActiveView('home');
    fetchAppData();
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('flipzone_token');
    setActiveView('home');
  };

  const toggleComplete = async (lessonId: string) => {
    if (!user || !token) return;
    const isRemoving = user.completed_lessons?.includes(lessonId);
    try {
      const res = await fetch('/api/user/lessons/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}`, 
          'x-action': isRemoving ? 'remove' : 'add' 
        },
        body: JSON.stringify({ lessonId })
      });
      if (res.ok) {
        const data = await res.json();
        setUser({ ...user, completed_lessons: data.completed_lessons });
      }
    } catch (e) { console.error(e); }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#010409] flex flex-col items-center justify-center space-y-6">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Inicijalizacija Hub-a</p>
      </div>
    );
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-[#010409]"><Login onLogin={login} /></div>;

  if (!user.isApproved) {
    return (
      <div className="min-h-screen bg-[#010409] flex items-center justify-center p-6 text-center">
        <div className="max-w-md glass p-12 rounded-[3rem] border border-white/5 space-y-8">
           <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto text-yellow-500">
             <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
           <div className="space-y-3">
             <h2 className="text-3xl font-black text-white tracking-tight uppercase">Pristup na čekanju</h2>
             <p className="text-slate-500 text-sm leading-relaxed">Administrator mora odobriti tvoj profil. Javi se u Discord grupu za aktivaciju.</p>
           </div>
           <button onClick={logout} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10">Odjavi se</button>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    if (activeView === 'admin' && user?.role === 'admin') return <AdminDashboard token={token!} onUpdate={fetchAppData} />;
    if (activeView === 'chat') return <Chat user={user} token={token} onAuthRedirect={logout} />;
    if (activeView === 'invoices') return <InvoiceGenerator />;
    if (activeView === 'profile') return <Profile user={user} token={token!} lessons={lessons} />;
    
    switch (activeView) {
      case 'lessons': return (
        <div className="space-y-16 animate-in fade-in">
          <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
            <h2 className="text-5xl md:text-6xl font-black text-white">Akademija <span className="text-blue-500">Znanja</span></h2>
            <p className="text-slate-500 text-sm">Sve video lekcije dolaze iz baze podataka.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
            {lessons.map(l => <LessonCard key={l.id} lesson={l} isCompleted={user.completed_lessons?.includes(l.id) || false} onClick={setActiveLesson} />)}
            {lessons.length === 0 && <p className="text-center col-span-full py-20 text-slate-600 font-black uppercase tracking-widest">Nema dostupnih modula</p>}
          </div>
        </div>
      );
      case 'suppliers': return (
        <div className="space-y-16 animate-in fade-in">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-5xl font-black text-white">Elite <span className="text-emerald-500">Supply</span></h2>
            <p className="text-slate-500 text-sm">Provjereni kontakti za tvoj biznis.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {suppliers.map(s => (
              <div key={s.id} className="glass p-8 rounded-[3rem] border border-white/5 group hover:border-emerald-500/30 transition-all">
                <img src={s.image_url} className="w-full aspect-square object-cover rounded-2xl mb-6 group-hover:scale-105 transition-transform" />
                <h3 className="text-2xl font-black text-white mb-2">{s.product_name}</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">{s.name}</p>
                <a href={s.buy_link} target="_blank" className="w-full block py-4 bg-blue-600 text-white rounded-xl text-center font-black uppercase text-[10px] tracking-widest">Naruči Proizvod</a>
              </div>
            ))}
            {suppliers.length === 0 && <p className="text-center col-span-full py-20 text-slate-600 font-black uppercase tracking-widest">Lista dobavljača je prazna</p>}
          </div>
        </div>
      );
      case 'announcements': return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in">
          <div className="text-center">
            <h2 className="text-5xl font-black text-white">Pulse <span className="text-blue-500">Center</span></h2>
          </div>
          <div className="space-y-8">
            {announcements.map(a => (
              <div key={a.id} className="glass p-10 rounded-[3.5rem] border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase rounded-xl border border-blue-600/20">{a.tag || 'INFO'}</span>
                  <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{a.date}</span>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">{a.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed">{a.message}</p>
              </div>
            ))}
          </div>
        </div>
      );
      default: return (
        <div className="space-y-12 animate-in fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 pb-10 border-b border-white/5">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter">Dobrodošao,<br/><span className="text-blue-500">{user.nickname || 'Članu'}</span></h2>
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">FlipZone Balkan Hub Aktiviran</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-6 flex items-center gap-10">
               <div className="text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Akademija</p>
                 <p className="text-2xl font-black text-white">{user.completed_lessons?.length || 0}<span className="text-slate-600 text-sm ml-1">/{lessons.length}</span></p>
               </div>
               <div onClick={() => setActiveView('profile')} className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-white cursor-pointer hover:scale-110 transition-transform">
                 {user.nickname?.charAt(0)}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div onClick={() => setActiveView('lessons')} className="glass p-10 rounded-[3.5rem] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group">
               <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-500 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               </div>
               <h3 className="text-3xl font-black text-white tracking-tighter mb-4">Akademija</h3>
               <p className="text-slate-500 text-sm">Započni ili nastavi s edukacijom.</p>
            </div>
            <div onClick={() => setActiveView('chat')} className="glass p-10 rounded-[3.5rem] border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group">
               <div className="w-14 h-14 rounded-2xl bg-purple-600/20 text-purple-500 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
               </div>
               <h3 className="text-3xl font-black text-white tracking-tighter mb-4">Zajednica</h3>
               <p className="text-slate-500 text-sm">Poveži se s ostalim članovima grupe.</p>
            </div>
            <div onClick={() => setActiveView('suppliers')} className="glass p-10 rounded-[3.5rem] border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group">
               <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
               </div>
               <h3 className="text-3xl font-black text-white tracking-tighter mb-4">Dobavljači</h3>
               <p className="text-slate-500 text-sm">Pronađi najbolje proizvode za reselling.</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen relative pb-40 bg-[#010409]">
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 z-[60]"></div>
      <header className="sticky top-0 z-50 glass border-b border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-4 cursor-pointer group">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-2xl text-white group-hover:rotate-6 transition-transform">F</div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">FlipZone</h1>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">Balkan Hub</span>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-white/5 p-1 rounded-2xl border border-white/5">
              {['home', 'lessons', 'suppliers', 'chat', 'profile'].map(v => (
                <button key={v} onClick={() => setActiveView(v as View)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === v ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>{v}</button>
              ))}
            </div>
            {user.role === 'admin' && (
              <button onClick={() => setActiveView('admin')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 ${activeView === 'admin' ? 'bg-white text-black' : 'text-white'}`}>Admin Panel</button>
            )}
            <button onClick={logout} className="p-3 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4" /></svg></button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-16 px-6">
        {renderActiveView()}
      </main>

      {activeLesson && (
        <LessonModal 
          lesson={activeLesson} isOpen={!!activeLesson} onClose={() => setActiveLesson(null)}
          onNext={() => { const idx = lessons.indexOf(activeLesson); if (idx < lessons.length - 1) setActiveLesson(lessons[idx+1]); }} 
          onPrev={() => { const idx = lessons.indexOf(activeLesson); if (idx > 0) setActiveLesson(lessons[idx-1]); }} 
          hasNext={lessons.indexOf(activeLesson) < lessons.length - 1} 
          hasPrev={lessons.indexOf(activeLesson) > 0}
          isCompleted={user.completed_lessons?.includes(activeLesson.id) || false}
          onToggleComplete={toggleComplete}
        />
      )}
      {activeUseful && <UsefulModal item={activeUseful} isOpen={!!activeUseful} onClose={() => setActiveUseful(null)} />}
    </div>
  );
};

export default App;
