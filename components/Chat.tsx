
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, Channel } from '../types';

interface ChatProps {
  user: User | null;
  token: string | null;
  onAuthRedirect: () => void;
}

export const Chat: React.FC<ChatProps> = ({ user, token, onAuthRedirect }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('opcenito');
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChannels = async () => {
    try {
      const res = await fetch('/api/chat/channels', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
        if (!data.find((c: any) => c.id === activeChannelId)) {
           if (data.length > 0) setActiveChannelId(data[0].id);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async () => {
    if (!activeChannelId) return;
    try {
      const res = await fetch(`/api/chat/messages/${activeChannelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      }
    } catch (e) { console.error(e); }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) { console.error(e); }
  };

  const createTicket = async () => {
    try {
      const res = await fetch('/api/chat/tickets', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const newTicket = await res.json();
        await fetchChannels();
        setActiveChannelId(newTicket.id);
        setShowSidebar(false);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchChannels();
    fetchMembers();
    const interval = setInterval(() => {
      fetchMessages();
      fetchChannels();
    }, 4000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    fetchMessages();
  }, [activeChannelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !input.trim() || !activeChannelId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/messages/${activeChannelId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: input })
      });
      if (res.ok) {
        setInput('');
        fetchMessages();
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-220px)] md:h-[750px] flex glass md:rounded-[3rem] overflow-hidden border border-white/5 animate-in zoom-in duration-500 relative">
      
      {/* Sidebar - Kanali (Z-50 on mobile to cover chat) */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} absolute md:relative inset-0 md:inset-auto z-50 md:z-auto w-full md:w-72 bg-[#010409] md:bg-black/40 border-r border-white/5 flex flex-col shrink-0 transition-transform duration-300 ease-in-out`}>
        <div className="p-6 h-20 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-white font-black text-lg uppercase tracking-widest">FlipZone <span className="text-blue-500">Hub</span></h3>
          <button onClick={() => setShowSidebar(false)} className="md:hidden p-2 text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-8 custom-scrollbar">
          {/* Public Channels */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Sobe za zajednicu</p>
            <div className="space-y-1">
              {channels.filter(c => c.type === 'public').map(channel => (
                <button
                  key={channel.id}
                  onClick={() => { setActiveChannelId(channel.id); setShowSidebar(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeChannelId === channel.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <span className="opacity-50">#</span>
                  {channel.name}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Channels */}
          <div>
            <div className="flex items-center justify-between mb-4 ml-2 pr-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aktivni Ticketi</p>
              <button onClick={createTicket} className="p-1 hover:bg-white/10 rounded-lg text-blue-500 transition-all">
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </button>
            </div>
            <div className="space-y-1">
              {channels.filter(c => c.type === 'ticket').map(channel => (
                <button
                  key={channel.id}
                  onClick={() => { setActiveChannelId(channel.id); setShowSidebar(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${activeChannelId === channel.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <svg className="w-4 h-4 opacity-50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                  <span className="truncate">{channel.name}</span>
                </button>
              ))}
              {channels.filter(c => c.type === 'ticket').length === 0 && (
                 <p className="text-[9px] text-slate-600 text-center py-4 px-4 leading-relaxed">Nemaš otvorenih ticketa. Trebaš pomoć? Klikni na + gore.</p>
              )}
            </div>
          </div>
        </div>

        {/* User Info Sidebar Footer (Mobile Only) */}
        <div className="md:hidden p-6 border-t border-white/5">
           <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white">
                {user?.nickname?.charAt(0)}
             </div>
             <div>
               <p className="text-white font-bold text-sm">{user?.nickname}</p>
               <p className="text-[10px] text-slate-500 uppercase font-black">{user?.role}</p>
             </div>
           </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-grow flex flex-col min-w-0 bg-black/20">
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-8 bg-black/40">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="text-2xl opacity-30 text-blue-500 hidden md:inline">#</span>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-sm leading-tight">{activeChannel?.name || 'Odaberi kanal'}</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[150px] md:max-w-none">{activeChannel?.type === 'ticket' ? 'Privatni razgovor s adminom' : 'Javni kanal zajednice'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Online Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{members.length} ONLINE</span>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          {messages.map((msg: any) => (
            <div key={msg.id} className={`flex gap-3 md:gap-4 group ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-[10px] md:text-xs shrink-0 shadow-lg ${msg.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
                {msg.nickname?.charAt(0) || msg.email.charAt(0)}
              </div>
              <div className={`space-y-1 min-w-0 max-w-[85%] md:max-w-[70%] ${msg.user_id === user?.id ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-3 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                  <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest ${msg.role === 'admin' ? 'text-blue-400' : 'text-white'}`}>
                    {msg.nickname || msg.email.split('@')[0]}
                    {msg.role === 'admin' && <span className="ml-2 bg-blue-600/10 text-blue-500 px-1.5 py-0.5 rounded text-[7px] md:text-[8px] border border-blue-600/20 tracking-tighter">ADMIN</span>}
                  </span>
                  <span className="text-[8px] md:text-[9px] text-slate-600 font-bold">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={`p-4 rounded-2xl md:rounded-3xl text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.user_id === user?.id ? 'bg-blue-600/20 border border-blue-500/20 rounded-tr-none' : 'bg-white/5 border border-white/10 rounded-tl-none'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none text-center p-6">
               <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 flex items-center justify-center mb-6">
                 <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
               </div>
               <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">Spremno za razgovor</p>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 md:p-8 bg-black/40 border-t border-white/5">
          <div className="flex gap-2 md:gap-4 relative items-center">
            <input 
              disabled={loading || !activeChannelId}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Poruka u #${activeChannel?.name || 'kanal'}`}
              className="flex-grow bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 md:px-6 py-3 md:py-4 text-white text-xs md:text-sm outline-none focus:border-blue-500 transition-all disabled:opacity-50"
            />
            <button 
              disabled={loading || !input.trim() || !activeChannelId}
              className="bg-blue-600 text-white w-10 h-10 md:w-auto md:px-10 md:h-14 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shrink-0"
            >
              <span className="hidden md:inline">Pošalji</span>
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Member List Sidebar (Right) - Desktop Only */}
      <div className="w-64 hidden xl:flex flex-col bg-black/40 border-l border-white/5">
        <div className="p-6 border-b border-white/5 h-20 flex items-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Zajednica — {members.length}</p>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {members.map(member => (
            <div key={member.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group cursor-default">
              <div className={`relative w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${member.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {member.nickname?.charAt(0) || member.email.charAt(0)}
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${member.isApproved ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${member.role === 'admin' ? 'text-blue-400' : 'text-slate-300'}`}>{member.nickname || member.email.split('@')[0]}</p>
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-tighter">{member.role === 'admin' ? 'Founder' : 'Member'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(59, 130, 246, 0.3); }
      `}</style>
    </div>
  );
};
