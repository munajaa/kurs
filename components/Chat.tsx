
import React, { useState, useEffect, useRef } from 'react';
import { User, Message, Channel } from '../types';

interface ChatProps {
  user: User | null;
  token: string | null;
}

export const Chat: React.FC<ChatProps> = ({ user, token }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChat = async () => {
    if (!token) return;
    try {
      const cRes = await fetch('/api/chat/channels', { headers: { 'Authorization': `Bearer ${token}` } });
      if (cRes.ok) setChannels(await cRes.json());

      const mRes = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (mRes.ok) setMembers(await mRes.json());

      const msgRes = await fetch(`/api/chat/messages/${activeChannelId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (msgRes.ok) setMessages(await msgRes.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchChat();
    const int = setInterval(fetchChat, 4000);
    return () => clearInterval(int);
  }, [token, activeChannelId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !token) return;
    setLoading(true);
    try {
      await fetch(`/api/chat/messages/${activeChannelId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input })
      });
      setInput('');
      fetchChat();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto h-[750px] flex glass rounded-[3rem] overflow-hidden border border-white/5 shadow-3xl animate-in zoom-in duration-500">
      <div className="w-64 md:w-72 border-r border-white/5 flex flex-col shrink-0 bg-black/40">
        <div className="p-8 h-24 flex items-center border-b border-white/5">
          <h3 className="text-white font-black uppercase tracking-widest text-sm">FlipZone <span className="text-blue-500">Hub</span></h3>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-8 no-scrollbar">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-2">Kanali</p>
            <div className="space-y-1">
              {channels.map(c => (
                <button key={c.id} onClick={() => setActiveChannelId(c.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${activeChannelId === c.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}>
                  <span className="opacity-30 font-black">#</span> {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col min-w-0 bg-black/10">
        <div className="h-24 border-b border-white/5 flex items-center px-10 justify-between">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-black text-blue-500 opacity-20 hidden md:inline">#</span>
            <div>
              <h4 className="text-white font-black uppercase tracking-widest text-sm">{channels.find(c => c.id === activeChannelId)?.name || 'Kanal'}</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sinkronizirano uživo</p>
            </div>
          </div>
          <div className="hidden sm:flex px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest">
            {members.length} ČLANOVA
          </div>
        </div>

        <div ref={scrollRef} className="flex-grow overflow-y-auto p-8 space-y-6 no-scrollbar">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${msg.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {(msg.nickname || 'U').charAt(0)}
              </div>
              <div className={`space-y-1 max-w-[75%] ${msg.user_id === user?.id ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-2 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'admin' ? 'text-blue-500' : 'text-white'}`}>{msg.nickname}</span>
                </div>
                <div className={`p-4 rounded-3xl text-sm leading-relaxed ${msg.user_id === user?.id ? 'bg-blue-600 text-white' : 'bg-white/5 border border-white/5 text-slate-300'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-8 border-t border-white/5 bg-black/40">
          <div className="flex gap-4">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Pošalji poruku u zajednicu..." className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-blue-500 outline-none transition-all" />
            <button type="submit" disabled={loading || !input.trim()} className="bg-blue-600 text-white px-10 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50">Pošalji</button>
          </div>
        </form>
      </div>

      <div className="w-64 hidden xl:flex flex-col border-l border-white/5 bg-black/40">
        <div className="p-6 h-24 flex items-center border-b border-white/5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Članovi</p>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2 no-scrollbar">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${m.role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{m.nickname?.charAt(0)}</div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{m.nickname}</p>
                <p className="text-[8px] font-black uppercase text-slate-600">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
