
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
    if (!token) { setIsInitializing(false); return; }
    try {
      const res = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUser(await res.json());
      else { localStorage.removeItem('flipzone_token'); setToken(null); }
    } catch (e) { console.error(e); }
    finally { setIsInitializing(false); }
  }, [token]);

  useEffect(() => { fetchAppData(); verifyUser(); }, [fetchAppData, verifyUser]);

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

  if (isInitializing) return (
    <div className="min-h-screen bg-[#010409] flex flex-col items-center justify-center space-y-6">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Sinkronizacija Hub-a</p>
    </div>
  );

  if (!user) return <div className="min-h-screen flex items-center justify-center py-20 px-4 bg-[#010409]"><Login onLogin={login} /></div>;

  if (!user.isApproved) return (
    <div className="min-h-screen bg-[#010409] flex items-center justify-center p-6 text-center">
      <div className="max-w-md glass p-12 rounded-[3.5rem] border border-white/5 space-y-8">
         <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto text-yellow-500 animate-pulse">
           <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
         </div>
         <div className="space-y-3">
           <h2 className="text-3xl font-black text-white tracking-tight uppercase">Čekanje Aktivacije</h2>
           <p className="text-slate-500 text-sm leading-relaxed">Tvoj profil mora biti odobren od strane administratora. Javi se u Discord grupu za pristup.</p>
         </div>
         <button onClick={logout} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10 active:scale-95 transition-all">Odjava</button>
      </div>
    </div>
  );

  const renderActiveView = () => {
    if (activeView === 'admin' && user?.role === 'admin') return <AdminDashboard token={token!} onUpdate={fetchAppData} />;
    if (activeView === 'chat') return <Chat user={user} token={token} />;
    if (activeView === 'invoices') return <InvoiceGenerator />;
    if (activeView === 'profile') return <Profile user={user} token={token!} lessons={lessons} />;
    
    switch (activeView) {
      case 'lessons': return (
        <div className="space-y-16 animate-in fade-in">
          <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Akademija <span className="text-blue-500">Znanja</span></h2>
            <p className="text-slate-500 text-sm md:text-base">Sve video lekcije učitane su izravno iz baze podataka.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
            {lessons.map(l => <LessonCard key={l.id} lesson={l} isCompleted={user.completed_lessons?.includes(l.id) || false} onClick={setActiveLesson} />)}
            {lessons.length === 0 && <p className="text-center col-span-full py-20 text-slate-700 font-black uppercase tracking-widest">Nema modula u bazi</p>}
          </div>
        </div>
      );
      case 'suppliers': return (
        <div className="space-y-16 animate-in fade-in">
          <div className="text-center max-w-2xl mx-auto px-4">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Elite <span className="text-emerald-500">Supply</span></h2>
            <p className="text-slate-500 text-sm md:text-base">Provjereni kontakti učitani iz baze.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {suppliers.map(s => (
              <div key={s.id} className="glass p-8 rounded-[3.5rem] border border-white/5 group hover:border-emerald-500/30 transition-all flex flex-col h-full">
                <div className="relative aspect-square rounded-3xl overflow-hidden mb-6 bg-black">
                  <img src={s.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={s.product_name} />
                </div>
                <div className="flex-grow">
                  <h3 className="text-2xl font-black text-white mb-2 leading-tight">{s.product_name}</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">{s.name}</p>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed line-clamp-2">{s.description || 'Premium dobavljač s provjerenom kvalitetom.'}</p>
                </div>
                <a href={s.buy_link} target="_blank" className="w-full block py-5 bg-blue-600 text-white rounded-2xl text-center font-black uppercase text-[11px] tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">Naruči Proizvod</a>
              </div>
            ))}
            {suppliers.length === 0 && <p className="text-center col-span-full py-20 text-slate-700 font-black uppercase tracking-widest">Nema dobavljača u bazi</p>}
          </div>
        </div>
      );
      case 'announcements': return (
        <div className="max-w-4xl mx-auto space-y-16 animate-in fade-in">
          <div className="text-center">
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-4">Pulse <span className="text-blue-500">Center</span></h2>
            <p className="text-slate-500 text-sm uppercase font-black tracking-widest">Vijesti iz Hub-a</p>
          </div>
          <div className="space-y-8 px-4">
            {announcements.map(a => (
              <div key={a.id} className="glass p-10 rounded-[4rem] border border-white/5 space-y-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                </div>
                <div className="flex items-center justify-between">
                  <span className="px-4 py-1.5 bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase rounded-xl border border-blue-600/20 tracking-widest">{a.tag || 'UPDATE'}</span>
                  <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">{a.date || 'Danas'}</span>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">{a.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed">{a.message}</p>
              </div>
            ))}
            {announcements.length === 0 && <p className="text-center py-20 text-slate-700 font-black uppercase tracking-widest">Nema obavijesti</p>}
          </div>
        </div>
      );
      default: return (
        <div className="space-y-12 animate-in fade-in duration-700 px-4 md:px-0">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-10 pb-10 border-b border-white/5">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-none">Bok,<br/><span className="text-blue-500">{user.nickname || 'Članu'}</span></h2>
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.5em] ml-1">FlipZone Balkan Hub Aktiviran</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-[3rem] p-8 flex items-center gap-10 backdrop-blur-3xl shadow-2xl">
               <div className="text-center">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Edukacija</p>
                 <p className="text-3xl font-black text-white">{user.completed_lessons?.length || 0}<span className="text-slate-600 text-sm ml-1">/{lessons.length}</span></p>
               </div>
               <div onClick={() => setActiveView('profile')} className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center font-black text-2xl text-white cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-xl shadow-blue-600/30">
                 {(user.nickname || user.email).charAt(0).toUpperCase()}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div onClick={() => setActiveView('lessons')} className="glass p-12 rounded-[4rem] border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></div>
               <h3 className="text-4xl font-black text-white tracking-tighter mb-4">Akademija</h3>
               <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Kreni učenje</p>
            </div>
            <div onClick={() => setActiveView('chat')} className="glass p-12 rounded-[4rem] border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20" /></svg></div>
               <h3 className="text-4xl font-black text-white tracking-tighter mb-4">Zajednica</h3>
               <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Uđi u Chat Hub</p>
            </div>
            <div onClick={() => setActiveView('suppliers')} className="glass p-12 rounded-[4rem] border border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
               <h3 className="text-4xl font-black text-white tracking-tighter mb-4">Dobavljači</h3>
               <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Pronađi Proizvode</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen relative pb-40 bg-[#010409]">
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 z-[60]"></div>
      <header className="sticky top-0 z-50 glass border-b border-white/5 bg-black/40 py-2 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-4 cursor-pointer group">
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-xl text-white group-hover:rotate-12 transition-transform shadow-lg shadow-blue-600/30">F</div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-white uppercase tracking-tighter leading-none">FlipZone</h1>
              <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Balkan Hub</span>
            </div>
          </div>
          <nav className="flex items-center gap-3">
            <div className="hidden lg:flex items-center bg-white/5 p-1 rounded-2xl border border-white/5">
              {(['home', 'lessons', 'suppliers', 'chat'] as View[]).map(v => (
                <button key={v} onClick={() => setActiveView(v)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === v ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>{v}</button>
              ))}
            </div>
            {user.role === 'admin' && (
              <button onClick={() => setActiveView('admin')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-600/20 ${activeView === 'admin' ? 'bg-white text-black' : 'text-blue-500 bg-blue-500/10'}`}>Admin</button>
            )}
            <button onClick={logout} className="p-2.5 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-500/10"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg></button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-16 px-6">
        {renderActiveView()}
      </main>

      {activeLesson && (
        <LessonModal 
          lesson={activeLesson} isOpen={!!activeLesson} onClose={() => setActiveLesson(null)}
          onNext={() => { const idx = lessons.findIndex(l => l.id === activeLesson.id); if (idx < lessons.length - 1) setActiveLesson(lessons[idx+1]); }} 
          onPrev={() => { const idx = lessons.findIndex(l => l.id === activeLesson.id); if (idx > 0) setActiveLesson(lessons[idx-1]); }} 
          hasNext={lessons.findIndex(l => l.id === activeLesson.id) < lessons.length - 1} 
          hasPrev={lessons.findIndex(l => l.id === activeLesson.id) > 0}
          isCompleted={user.completed_lessons?.includes(activeLesson.id) || false}
          onToggleComplete={() => {}} 
        />
      )}
    </div>
  );
};

export default App;
