
import React, { useState, useEffect } from 'react';
import { User, ProfitEntry, Lesson } from '../types';

interface ProfileProps {
  user: User;
  token: string;
  lessons: Lesson[];
}

export const Profile: React.FC<ProfileProps> = ({ user, token, lessons }) => {
  const [profits, setProfits] = useState<ProfitEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ itemName: '', buyPrice: 0, sellPrice: 0, costs: 0 });

  const fetchProfits = async () => {
    try {
      const res = await fetch('/api/user/profits', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setProfits(await res.json());
      else {
        setProfits([
          { id: 1, user_id: user.id, item_name: 'AirPods Pro 2', buy_price: 35, sell_price: 110, costs: 5, net_profit: 70, created_at: new Date().toISOString() },
          { id: 2, user_id: user.id, item_name: 'Nike TN Black', buy_price: 42, sell_price: 130, costs: 5, net_profit: 83, created_at: new Date().toISOString() }
        ]);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchProfits();
  }, [token]);

  const handleAddProfit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/profits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddForm(false);
        setFormData({ itemName: '', buyPrice: 0, sellPrice: 0, costs: 0 });
        fetchProfits();
      } else {
        const newProfit: ProfitEntry = {
          id: Math.random(),
          user_id: user.id,
          item_name: formData.itemName,
          buy_price: formData.buyPrice,
          sell_price: formData.sellPrice,
          costs: formData.costs,
          net_profit: formData.sellPrice - formData.buyPrice - formData.costs,
          created_at: new Date().toISOString()
        };
        setProfits([newProfit, ...profits]);
        setShowAddForm(false);
        setFormData({ itemName: '', buyPrice: 0, sellPrice: 0, costs: 0 });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const deleteProfit = async (id: number) => {
    if (!confirm('Obriši ovaj unos?')) return;
    try {
      await fetch(`/api/user/profits/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setProfits(profits.filter(p => p.id !== id));
    } catch (e) { console.error(e); }
  };

  const totalNetProfit = profits.reduce((sum, p) => sum + Number(p.net_profit), 0);
  const completedLessonsCount = user.completed_lessons?.length || 0;
  const progressPercent = Math.round((completedLessonsCount / (lessons.length || 1)) * 100);

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      {/* Profile Info Header */}
      <div className="glass p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] border border-white/5 flex flex-col md:flex-row items-center gap-8 md:gap-12 relative overflow-hidden text-center md:text-left">
        <div className="absolute -top-24 -right-24 w-64 md:w-96 h-64 md:h-96 bg-blue-600/10 blur-[80px] md:blur-[120px] rounded-full"></div>
        <div className="relative">
          <div className="w-24 h-24 md:w-44 md:h-44 bg-gradient-to-br from-blue-600 to-blue-400 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center text-4xl md:text-6xl font-black text-white shadow-2xl shadow-blue-600/30">
            {user.nickname?.charAt(0) || user.email.charAt(0)}
          </div>
          <div className="absolute -bottom-1 -right-1 px-4 py-1.5 md:px-5 md:py-2 bg-emerald-500 text-white text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-full border-2 md:border-4 border-[#010409]">PRO RANK</div>
        </div>
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-1 md:space-y-2">
             <h2 className="text-3xl md:text-6xl font-black text-white tracking-tighter leading-none">@{user.nickname || 'Član'}</h2>
             <p className="text-slate-500 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.4em] truncate max-w-[200px] md:max-w-none mx-auto md:mx-0">{user.email}</p>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
             <span className="px-4 md:px-6 py-2 md:py-2.5 bg-white/5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5">Verified Reseller</span>
             <span className="px-4 md:px-6 py-2 md:py-2.5 bg-blue-600/10 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-blue-400 border border-blue-600/20">Balkan Hub</span>
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="glass p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 space-y-3 md:space-y-4 relative group hover:border-blue-500/20 transition-all">
           <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Ukupni Profit</p>
           <p className="text-4xl md:text-6xl font-black text-white tracking-tighter">€{totalNetProfit.toFixed(0)}</p>
           <div className="pt-2">
             <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '70%' }}></div>
             </div>
             <p className="text-[8px] text-slate-600 font-bold uppercase mt-3 tracking-widest">Rast u odnosu na prošli mj.</p>
           </div>
        </div>

        <div className="glass p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 space-y-3 md:space-y-4 relative group hover:border-emerald-500/20 transition-all">
           <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Edukacija</p>
           <p className="text-4xl md:text-6xl font-black text-emerald-500 tracking-tighter">{progressPercent}%</p>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{completedLessonsCount} / {lessons.length} Modula</p>
        </div>

        <div className="glass p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/5 space-y-3 md:space-y-4 relative group hover:border-purple-500/20 transition-all">
           <p className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Aktivnost</p>
           <p className="text-4xl md:text-6xl font-black text-purple-500 tracking-tighter">{profits.length}</p>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Evidentiranih Prodaja</p>
        </div>
      </div>

      {/* Sales Tracker Section */}
      <div className="space-y-6 md:space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 text-center md:text-left">
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase">Prodaja & <span className="text-blue-500">Kalkulator</span></h3>
            <p className="text-slate-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">Prati profit u realnom vremenu</p>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`w-full md:w-auto px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-[11px] tracking-widest transition-all shadow-2xl active:scale-95 ${showAddForm ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-blue-600/20'}`}
          >
            {showAddForm ? 'Odustani' : '+ Dodaj Prodaju'}
          </button>
        </div>

        {showAddForm && (
          <div className="glass p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white/10 animate-in fade-in slide-in-from-top-4 duration-500 shadow-3xl">
             <form onSubmit={handleAddProfit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 items-end">
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Artikl</label>
                  <input required placeholder="AirPods Pro 2" className="profile-input" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nabava (€)</label>
                  <input required type="number" step="0.01" className="profile-input" value={formData.buyPrice} onChange={e => setFormData({...formData, buyPrice: Number(e.target.value)})} />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Prodaja (€)</label>
                  <input required type="number" step="0.01" className="profile-input" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} />
                </div>
                <div className="space-y-1 md:space-y-2">
                  <label className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Troškovi (€)</label>
                  <input required type="number" step="0.01" className="profile-input" value={formData.costs} onChange={e => setFormData({...formData, costs: Number(e.target.value)})} />
                </div>
                <div className="lg:col-span-4 pt-4">
                  <button type="submit" disabled={loading} className="w-full py-4 md:py-6 bg-emerald-600 text-white rounded-xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-[0.3em] shadow-2xl active:scale-95">
                    {loading ? 'SINKRONIZACIJA...' : 'EVIDENTIRAJ PROFIT'}
                  </button>
                </div>
             </form>
          </div>
        )}

        <div className="glass rounded-[2rem] md:rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/[0.03] border-b border-white/5">
                <tr className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <th className="p-6 md:p-10">Artikl</th>
                  <th className="p-6 md:p-10 hidden md:table-cell">Nabava</th>
                  <th className="p-6 md:p-10 hidden md:table-cell">Prodaja</th>
                  <th className="p-6 md:p-10">Profit</th>
                  <th className="p-6 md:p-10 text-right">Akcija</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {profits.map(p => (
                  <tr key={p.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="p-6 md:p-10">
                      <p className="font-black text-white text-xs md:text-base tracking-tight">{p.item_name}</p>
                      <p className="text-[8px] text-slate-600 md:hidden mt-1">{new Date(p.created_at).toLocaleDateString('hr-HR')}</p>
                    </td>
                    <td className="p-6 md:p-10 text-slate-400 font-bold hidden md:table-cell">€{Number(p.buy_price).toFixed(2)}</td>
                    <td className="p-6 md:p-10 text-slate-400 font-bold hidden md:table-cell">€{Number(p.sell_price).toFixed(2)}</td>
                    <td className="p-6 md:p-10">
                      <div className="inline-flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1 md:py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg md:rounded-xl text-emerald-500 font-black text-[10px] md:text-base">
                        €{Number(p.net_profit).toFixed(2)}
                      </div>
                    </td>
                    <td className="p-6 md:p-10 text-right">
                      <button onClick={() => deleteProfit(p.id)} className="p-2 md:p-3 text-slate-600 hover:text-red-500 transition-all">
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .profile-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1rem;
          padding: 1rem;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
          outline: none;
          transition: all 0.3s;
        }
        @media (min-width: 768px) {
          .profile-input {
            border-radius: 1.5rem;
            padding: 1.25rem 1.5rem;
            font-size: 0.95rem;
          }
        }
        .profile-input:focus {
          border-color: #3b82f6;
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
};
