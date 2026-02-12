
import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  token: string;
  onUpdate: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'suppliers' | 'users' | 'useful'>('lessons');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/.netlify/functions/api/admin/${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id: any) => {
    if (!confirm('Sigurno želiš obrisati?')) return;
    try {
      const res = await fetch(`/.netlify/functions/api/admin/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const toggleApproval = async (id: number) => {
    try {
      const res = await fetch(`/.netlify/functions/api/admin/users/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <h2 className="text-4xl font-black text-white">Admin <span className="text-blue-500">Panel</span></h2>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {['lessons', 'suppliers', 'useful', 'users'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t as any)}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-[3rem] border border-white/10 overflow-hidden glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/5 bg-white/5">
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="p-6">{activeTab === 'users' ? 'User Info' : 'ID / Name'}</th>
                <th className="p-6">Details</th>
                <th className="p-6 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((item: any) => (
                <tr key={item.id} className="text-sm text-slate-300">
                  <td className="p-6">
                    {activeTab === 'users' ? (
                      <div className="space-y-1">
                        <p className="font-bold text-white">{item.firstName} {item.lastName} (@{item.nickname})</p>
                        <p className="text-[10px] text-slate-500">{item.email}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-bold text-white">{item.title || item.productName}</p>
                        <p className="text-[10px] text-slate-600">{item.id}</p>
                      </div>
                    )}
                  </td>
                  <td className="p-6">
                    {activeTab === 'users' ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400">ROLE: {item.role.toUpperCase()}</p>
                        <p className="text-xs">{item.phone || 'No phone'}</p>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${item.isApproved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {item.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs line-clamp-1">{item.description || item.content?.substring(0, 50)}</p>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {activeTab === 'users' && item.role !== 'admin' && (
                        <button 
                          onClick={() => toggleApproval(item.id)} 
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${item.isApproved ? 'bg-slate-800 text-slate-400' : 'bg-emerald-600 text-white'}`}
                        >
                          {item.isApproved ? 'Revoke' : 'Approve'}
                        </button>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 font-bold uppercase text-[10px] tracking-widest px-2">Obrisi</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <p className="text-center p-10 text-slate-500">Učitavanje...</p>}
          {!loading && data.length === 0 && <p className="text-center p-10 text-slate-500">Nema podataka u bazi.</p>}
        </div>
      </div>
    </div>
  );
};
