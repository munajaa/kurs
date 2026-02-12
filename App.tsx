
import React, { useState, useEffect, useCallback } from 'react';
import { LESSONS_DATA as STATIC_LESSONS } from './data/lessons';
import { SUPPLIERS_DATA as STATIC_SUPPLIERS } from './data/suppliers';
import { ANNOUNCEMENTS_DATA as STATIC_ANNOUNCEMENTS } from './data/announcements';
import { USEFUL_DATA as STATIC_USEFUL } from './data/useful';
import { Lesson, UserProgress, View, User, Supplier, Announcement, UsefulItem } from './types';
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
  
  // PREVIEW MODE DISABLED: System returns to standard Auth flow
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('flipzone_token'));
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [lessons, setLessons] = useState<Lesson[]>(STATIC_LESSONS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(STATIC_SUPPLIERS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(STATIC_ANNOUNCEMENTS);
  const [usefulItems, setUsefulItems] = useState<UsefulItem[]>(STATIC_USEFUL);

  const fetchAppData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const data = await res.json();
        if (data.lessons?.length) setLessons(data.lessons);
        if (data.suppliers?.length) setSuppliers(data.suppliers);
        if (data.announcements?.length) setAnnouncements(data.announcements);
        if (data.useful?.length) setUsefulItems(data.useful);
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
        const userData = await res.json();
        setUser(userData);
      } else {
        localStorage.removeItem('flipzone_token');
        setToken(null);
      }
    } catch (e) {
      console.error("Verification error", e);
    } finally {
      setIsInitializing(false);
    }
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
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Inicijalizacija Hub-a</p>
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
             <p className="text-slate-500 text-sm leading-relaxed">Tvoj račun je kreiran, ali administrator ga mora odobriti prije nego dobiješ puni pristup akademiji.</p>
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
        <div className="space-y-8 md:space-y-16 animate-in fade-in slide-in-from-bottom-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">Akademija <span className="text-blue-500">Znanja</span></h2>
            <p className="text-slate-500 text-sm md:text-lg leading-relaxed">Vrhunska edukacija za reselling profesionalce na Balkanu.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 px-4">
            {lessons.map(l => <LessonCard key={l.id} lesson={l} isCompleted={user.completed_lessons?.includes(l.id) || false} onClick={setActiveLesson} />)}
          </div>
        </div>
      );
      case 'suppliers': return (
        <div className="space-y-8 md:space-y-16 animate-in fade-in slide-in-from-bottom-8">
          <div className="text-center max-w-2xl mx-auto px-4">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">Elite <span className="text-emerald-500">Supply</span></h2>
            <p className="text-slate-500 text-sm md:text-lg leading-relaxed">Provjereni kontakti s kojima gradite profit.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 px-4">
            {suppliers.map(s => (
              <div key={s.id} className="glass p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-white/5 flex flex-col gap-4 md:gap-6 group hover:border-emerald-500/30 transition-all duration-500">
                <div className="overflow-hidden rounded-2xl aspect-square bg-slate-900 border border-white/5">
                   <img src={s.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={s.productName} />
                </div>
                <div className="flex-grow space-y-2">
                  <h3 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">{s.productName}</h3>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{s.name}</p>
                </div>
                <a href={s.buyLink} target="_blank" className="w-full py-4 md:py-5 rounded-xl md:rounded-2xl text-center font-black text-[10px] md:text-xs uppercase tracking-widest transition-all bg-blue-600 text-white shadow-xl shadow-blue-600/20 active:scale-95">Naruči Proizvod</a>
              </div>
            ))}
          </div>
        </div>
      );
      case 'announcements': return (
        <div className="max-w-4xl mx-auto space-y-8 md:space-y-16 animate-in fade-in slide-in-from-bottom-8 px-4">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">Pulse <span className="text-blue-500">Center</span></h2>
            <p className="text-slate-500 text-sm md:text-lg leading-relaxed">Najnovije objave i sistemske obavijesti.</p>
          </div>
          <div className="space-y-6 md:space-y-8">
            {announcements.map(a => (
              <div key={a.id} className="glass p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 space-y-4 md:space-y-6 hover:bg-white/[0.02] transition-colors relative overflow-hidden group">
                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                  <div className="flex-grow space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-blue-600/10 text-blue-400 text-[8px] md:text-[10px] font-black uppercase rounded-lg md:rounded-xl border border-blue-600/20 tracking-widest">{a.tag || 'SYSTEM'}</span>
                      <span className="text-[8px] md:text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">{a.date}</span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-white tracking-tight leading-tight">{a.title}</h3>
                    <p className="text-slate-400 text-sm md:text-lg leading-relaxed">{a.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      case 'useful': return (
        <div className="space-y-8 md:space-y-16 animate-in fade-in slide-in-from-bottom-8">
          <div className="text-center max-w-3xl mx-auto px-4">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">Resursi <span className="text-purple-500">Logistike</span></h2>
            <p className="text-slate-500 text-sm md:text-lg">Alati i vodiči koji vam štede vrijeme i novac.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 px-4">
            {usefulItems.map(u => (
              <div key={u.id} onClick={() => setActiveUseful(u)} className="glass p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/5 hover:border-purple-500/40 transition-all cursor-pointer group relative overflow-hidden">
                <div className="space-y-4 md:space-y-6">
                  <span className="px-3 py-1 bg-purple-600/10 text-purple-400 text-[8px] md:text-[9px] font-black uppercase rounded-lg border border-purple-600/20 tracking-widest">{u.category}</span>
                  <div className="space-y-2 md:space-y-3">
                    <h3 className="text-xl md:text-2xl font-black text-white group-hover:text-purple-400 transition-colors leading-tight">{u.title}</h3>
                    <p className="text-slate-500 text-xs md:text-sm leading-relaxed line-clamp-3">{u.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      default: return (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 px-4 md:px-0">
          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 pb-6 md:pb-10 border-b border-white/5 text-center md:text-left">
            <div className="space-y-3 md:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full text-blue-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span> {user.role === 'admin' ? 'ADMIN PANEL' : 'HUB AKTIVAN'}
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">Dobrodošao,<br/><span className="text-blue-500">{user.nickname || 'Članu'}</span></h2>
              <p className="text-slate-500 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.4em]">FlipZone Balkan Control Panel</p>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 flex items-center gap-6 md:gap-10 backdrop-blur-3xl shadow-2xl w-full md:w-auto justify-center">
               <div className="text-center space-y-1">
                 <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Akademija</p>
                 <p className="text-xl md:text-2xl font-black text-white">{user.completed_lessons?.length || 0}<span className="text-slate-600 text-xs md:text-sm ml-1">/{lessons.length}</span></p>
               </div>
               <div className="w-[1px] h-8 md:h-10 bg-white/10"></div>
               <div onClick={() => setActiveView('profile')} className="flex items-center gap-3 md:gap-4 cursor-pointer group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center font-black text-white group-hover:scale-110 transition-transform">
                    {user.nickname?.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] md:text-xs font-black text-white group-hover:text-blue-400 transition-colors">Moj Profil</p>
                    <p className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest">Statistika →</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div onClick={() => setActiveView('lessons')} className="dashboard-tile group bg-blue-600/5 hover:border-blue-500/30">
               <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <svg className="w-24 h-24 md:w-32 md:h-32 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
               </div>
               <div className="space-y-3 md:space-y-4">
                 <div className="dashboard-icon bg-blue-600/20 text-blue-500 border-blue-500/20">
                    <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                 </div>
                 <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter">Akademija</h3>
                 <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">Svi video moduli i lekcije za skaliranje trgovine.</p>
               </div>
               <div className="dashboard-link text-blue-500">NASTAVI UČITI →</div>
            </div>

            <div onClick={() => setActiveView('chat')} className="dashboard-tile group bg-purple-600/5 hover:border-purple-500/30">
               <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <svg className="w-24 h-24 md:w-32 md:h-32 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
               </div>
               <div className="space-y-3 md:space-y-4">
                 <div className="dashboard-icon bg-purple-600/20 text-purple-500 border-purple-500/20">
                    <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                 </div>
                 <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter">Zajednica</h3>
                 <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">Chat kanali, support ticketi i 1:1 podrška admina.</p>
               </div>
               <div className="dashboard-link text-purple-500">UĐI U CHAT HUB →</div>
            </div>

            <div onClick={() => setActiveView('suppliers')} className="dashboard-tile group bg-emerald-600/5 hover:border-emerald-500/30">
               <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <svg className="w-24 h-24 md:w-32 md:h-32 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
               </div>
               <div className="space-y-3 md:space-y-4">
                 <div className="dashboard-icon bg-emerald-600/20 text-emerald-500 border-emerald-500/20">
                    <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                 </div>
                 <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter">Dobavljači</h3>
                 <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">Elite kontakti i linkovi za nabavu winner proizvoda.</p>
               </div>
               <div className="dashboard-link text-emerald-500">PREGLEDAJ MREŽU →</div>
            </div>

            <div className="md:col-span-2 glass p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 space-y-6 md:space-y-8">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-blue-500 rounded-full"></div>
                   <h4 className="text-[10px] md:text-sm font-black text-white uppercase tracking-widest">Zadnji Pulse Update</h4>
                 </div>
                 <button onClick={() => setActiveView('announcements')} className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Vidi Sve</button>
               </div>
               <div className="space-y-3 md:space-y-4">
                 {announcements.slice(0, 2).map(a => (
                   <div key={a.id} className="bg-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all" onClick={() => setActiveView('announcements')}>
                     <div className="space-y-1">
                       <p className="text-white font-bold text-sm md:text-lg leading-tight group-hover:text-blue-400 transition-colors">{a.title}</p>
                       <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">{a.date}</p>
                     </div>
                     <span className="px-2 md:px-4 py-1 md:py-1.5 bg-blue-600/20 text-blue-400 text-[7px] md:text-[8px] font-black uppercase rounded-lg md:rounded-xl border border-blue-600/10 tracking-widest">{a.tag}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div onClick={() => setActiveView('invoices')} className="glass p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 flex flex-col justify-between group hover:border-blue-500/20 transition-all cursor-pointer min-h-[220px]">
               <div className="space-y-4 md:space-y-6">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-800/50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 border border-white/5 group-hover:text-blue-400 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all">
                     <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                   </div>
                   <div>
                     <h4 className="text-white font-black uppercase tracking-tight text-sm md:text-base">Računi</h4>
                     <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">Generator Faktura</p>
                   </div>
                 </div>
                 <p className="text-slate-500 text-xs md:text-sm leading-relaxed">Profesionalni iStyle, Nike i Apple računi.</p>
               </div>
               <button className="w-full py-3 md:py-4 bg-white/5 text-white rounded-xl md:rounded-2xl font-black uppercase text-[8px] md:text-[10px] tracking-widest border border-white/5 hover:bg-white hover:text-black transition-all">Pokreni Generator</button>
            </div>

            <div onClick={() => setActiveView('useful')} className="md:col-span-3 glass p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-white/5 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 group cursor-pointer hover:border-purple-500/20 transition-all text-center md:text-left">
               <div className="space-y-3 md:space-y-4">
                  <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">Biblioteka Resursa</h3>
                  <p className="text-slate-400 font-medium text-sm md:text-lg leading-relaxed max-w-xl">Alati, logistički vodiči i checkliste za profi resellere.</p>
               </div>
               <div className="w-16 h-16 md:w-20 md:h-20 bg-white text-black rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
               </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen relative pb-32 md:pb-40 bg-[#010409]">
      <style>{`
        .dashboard-tile {
          position: relative;
          padding: 1.75rem;
          border-radius: 2.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
          height: 260px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 768px) {
          .dashboard-tile {
            padding: 2.5rem;
            border-radius: 3.5rem;
            height: 320px;
          }
        }
        .dashboard-tile:hover {
          transform: translateY(-8px) scale(1.02);
          background-color: rgba(255, 255, 255, 0.02);
        }
        .dashboard-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
        }
        @media (min-width: 768px) {
          .dashboard-icon {
            width: 3.5rem;
            height: 3.5rem;
            border-radius: 1.25rem;
          }
        }
        .dashboard-link {
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          transition: transform 0.3s;
        }
        @media (min-width: 768px) {
          .dashboard-link {
            font-size: 10px;
          }
        }
        .dashboard-tile:hover .dashboard-link {
          transform: translateX(8px);
        }
        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 4px;
          transition: all 0.2s;
        }
        .bottom-nav-item svg {
          width: 20px;
          height: 20px;
          opacity: 0.6;
        }
        .bottom-nav-item.active svg {
          opacity: 1;
          color: #3b82f6;
          transform: translateY(-2px);
        }
        .bottom-nav-item span {
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.6;
        }
        .bottom-nav-item.active span {
          opacity: 1;
          color: #3b82f6;
        }
      `}</style>
      
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 z-[60]"></div>
      
      <header className="sticky top-0 z-50 glass border-b border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between">
          <div onClick={() => setActiveView('home')} className="flex items-center gap-3 md:gap-4 cursor-pointer group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-xl md:text-2xl text-white group-hover:scale-110 transition-transform">F</div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter leading-none">FlipZone</h1>
              <span className="text-[7px] md:text-[9px] font-black text-blue-500 uppercase tracking-[0.3em] mt-1">Balkan Hub</span>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <div className="hidden lg:flex items-center bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
              {[
                { id: 'home', label: 'Home' },
                { id: 'lessons', label: 'Edukacija' },
                { id: 'suppliers', label: 'Supply' },
                { id: 'chat', label: 'Chat' },
                { id: 'useful', label: 'Resursi' },
                { id: 'announcements', label: 'Pulse' },
                { id: 'profile', label: 'Profil' }
              ].map(v => (
                <button key={v.id} onClick={() => setActiveView(v.id as View)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === v.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}>{v.label}</button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <button onClick={() => setActiveView('admin')} className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all ${activeView === 'admin' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}>Admin</button>
              )}
              <button onClick={logout} className="p-2.5 md:p-3 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all border border-red-500/10 active:scale-90">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto ${activeView === 'chat' ? 'py-0 md:py-16' : 'py-8 md:pt-16'} px-0 md:px-6`}>
        {renderActiveView()}
      </main>

      {/* MOBILE BOTTOM NAVIGATION - One-hand Optimized */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] z-50">
        <div className="glass rounded-[2rem] border border-white/10 p-2 flex items-center justify-around shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black/80 backdrop-blur-3xl">
          <button onClick={() => setActiveView('home')} className={`bottom-nav-item ${activeView === 'home' ? 'active' : ''}`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span>Home</span>
          </button>
          <button onClick={() => setActiveView('lessons')} className={`bottom-nav-item ${activeView === 'lessons' ? 'active' : ''}`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span>Learn</span>
          </button>
          <button onClick={() => setActiveView('chat')} className={`bottom-nav-item ${activeView === 'chat' ? 'active' : ''}`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span>Chat</span>
          </button>
          <button onClick={() => setActiveView('profile')} className={`bottom-nav-item ${activeView === 'profile' ? 'active' : ''}`}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span>Pro</span>
          </button>
        </div>
      </div>

      {activeLesson && (
        <LessonModal 
          lesson={activeLesson} isOpen={!!activeLesson} onClose={() => setActiveLesson(null)}
          onNext={() => {}} onPrev={() => {}} hasNext={false} hasPrev={false}
          isCompleted={user.completed_lessons?.includes(activeLesson.id) || false}
          onToggleComplete={toggleComplete}
        />
      )}
      {activeUseful && <UsefulModal item={activeUseful} isOpen={!!activeUseful} onClose={() => setActiveUseful(null)} />}
    </div>
  );
};

export default App;
