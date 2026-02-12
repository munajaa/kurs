
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

    // Osnovna provjera na klijentu
    if (isRegister && (!formData.email || !formData.password || !formData.nickname)) {
      setError('Molimo ispunite email, lozinku i nadimak.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Nešto je pošlo po zlu. Pokušajte ponovno.');
      }
      
      onLogin(data.user, data.token);
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "Neuspješno povezivanje s poslužiteljem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto p-12 md:p-20 glass rounded-[4rem] animate-in fade-in slide-in-from-bottom-20 duration-1000 border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.5)]`}>
      <div className="text-center mb-14">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center font-black text-4xl mx-auto mb-8 shadow-2xl shadow-blue-600/30 text-white transition-transform hover:rotate-6">F</div>
        <h2 className="text-5xl font-black text-white tracking-tighter mb-4 leading-none">
          {isRegister ? 'Pridruži se Mreži' : 'Autorizacija'}
        </h2>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em]">FlipZone Balkan Learning Hub</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isRegister && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ime</label>
              <input required name="firstName" value={formData.firstName} onChange={handleChange} className="login-input" placeholder="Ivan" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prezime</label>
              <input required name="lastName" value={formData.lastName} onChange={handleChange} className="login-input" placeholder="Horvat" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nadimak *</label>
              <input required name="nickname" value={formData.nickname} onChange={handleChange} className="login-input" placeholder="ResellerMaster" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefon</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className="login-input" placeholder="+385 91..." />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Adresa *</label>
          <input required type="email" name="email" value={formData.email} onChange={handleChange} className="login-input" placeholder="tvoj@email.com" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lozinka *</label>
          <input required type="password" name="password" value={formData.password} onChange={handleChange} className="login-input" placeholder="••••••••" />
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl animate-in shake duration-300">
            <p className="text-red-400 text-[11px] font-black uppercase text-center tracking-widest">{error}</p>
          </div>
        )}
        
        <button disabled={loading} className="w-full py-6 bg-blue-600 text-white font-black rounded-[2rem] hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 active:scale-[0.98] text-xs uppercase tracking-[0.3em] mt-8">
          {loading ? 'SINKRONIZACIJA...' : isRegister ? 'ZATRAŽI PRISTUP' : 'PRISTUPI HUB-U'}
        </button>
      </form>
      
      <div className="mt-14 pt-10 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm font-medium">
          {isRegister ? 'Već imaš profil?' : 'Želiš postati član?'}{' '}
          <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-blue-500 font-black hover:underline ml-1">
            {isRegister ? 'Prijavi se ovdje' : 'Registriraj se sada'}
          </button>
        </p>
      </div>
      
      <style>{`
        .login-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1.5rem;
          padding: 1.2rem 1.8rem;
          color: white;
          outline: none;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-input:focus {
          border-color: #3b82f6;
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.1);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};
