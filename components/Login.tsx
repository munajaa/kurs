
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    nickname: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Neuspješna operacija');
        onLogin(data.user, data.token);
      } else {
        const text = await res.text();
        throw new Error(text || 'Greška na serveru (nepoznat format)');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Neuspješno povezivanje sa serverom.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-md mx-auto p-8 md:p-12 glass rounded-[3rem] animate-in fade-in slide-in-from-bottom-12 duration-1000 ${isRegister ? 'max-w-xl' : 'max-w-md'}`}>
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center font-black text-3xl mx-auto mb-6 shadow-2xl shadow-blue-600/30 text-white">F</div>
        <h2 className="text-4xl font-black text-white tracking-tight mb-2">
          {isRegister ? 'Novi Račun' : 'Dobrodošao nazad'}
        </h2>
        <p className="text-slate-500 font-medium">FlipZone Balkan Hub</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ime</label>
              <input required name="firstName" value={formData.firstName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-blue-500 outline-none" placeholder="Marko" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prezime</label>
              <input required name="lastName" value={formData.lastName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-blue-500 outline-none" placeholder="Marić" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nadimak</label>
              <input required name="nickname" value={formData.nickname} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-blue-500 outline-none" placeholder="Mare123" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefon</label>
              <input required name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-blue-500 outline-none" placeholder="+385..." />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Adresa</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-blue-500 outline-none transition-all" placeholder="tvoj@email.com" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lozinka</label>
          <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white focus:border-blue-500 outline-none transition-all" placeholder="••••••••" />
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl animate-in shake duration-300">
            <p className="text-red-400 text-xs font-bold text-center">{error}</p>
          </div>
        )}
        
        <button disabled={loading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50 text-xs uppercase tracking-widest mt-2">
          {loading ? 'Slanje...' : isRegister ? 'ZATRAŽI PRISTUP' : 'PRIJAVI SE'}
        </button>
      </form>
      
      <div className="mt-10 pt-8 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm font-medium">
          {isRegister ? 'Već imaš račun?' : 'Želiš se pridružiti?'}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-blue-500 font-black hover:underline ml-1">
            {isRegister ? 'Prijavi se' : 'Registriraj se'}
          </button>
        </p>
      </div>
    </div>
  );
};
