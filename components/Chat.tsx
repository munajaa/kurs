
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';

interface ChatProps {
  user: User | null;
  token: string | null;
  onAuthRedirect: () => void;
}

export const Chat: React.FC<ChatProps> = ({ user, token, onAuthRedirect }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/.netlify/functions/api/messages');
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token || !input.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/.netlify/functions/api/messages', {
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

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col glass rounded-[3rem] overflow-hidden">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div>
          <h2 className="text-2xl font-black text-white">Live <span className="text-blue-500">Chat</span></h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Globalni razgovor zajednice</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
        {messages.map((msg: any) => (
          <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
            <div className={`flex items-center gap-2 mb-1 ${msg.user_id === user?.id ? 'flex-row-reverse' : ''}`}>
              <span className={`text-[9px] font-black uppercase tracking-tighter ${msg.role === 'admin' ? 'text-blue-400' : 'text-slate-500'}`}>
                {msg.nickname || msg.email.split('@')[0]} {msg.role === 'admin' && '[ADMIN]'}
              </span>
              <span className="text-[8px] text-slate-600">{new Date(msg.created_at).toLocaleTimeString()}</span>
            </div>
            <div className={`px-4 py-3 rounded-2xl text-sm max-w-[80%] ${
              msg.user_id === user?.id 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-slate-600 text-xs py-20 uppercase tracking-widest">Nema poruka. Budi prvi!</p>}
      </div>

      <form onSubmit={sendMessage} className="p-6 border-t border-white/5 bg-black/40">
        <div className="flex gap-4">
          <input 
            disabled={!user || loading}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={user ? "Napiši nešto..." : "Prijavi se za razgovor"}
            className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-blue-500 transition-all disabled:opacity-50"
          />
          <button 
            disabled={!user || loading || !input.trim()}
            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            Pošalji
          </button>
        </div>
      </form>
    </div>
  );
};
