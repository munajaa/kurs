
import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  token: string;
  onUpdate: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'suppliers' | 'announcements' | 'useful' | 'users'>('lessons');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id: any) => {
    if (!confirm('Obrisati?')) return;
    try {
      const res = await fetch(`/api/admin/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleToggleApprove = async (userId: number) => {
    try {
      const res = await fetch(`/api/admin/users/approve/${userId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing ? `/api/admin/${activeTab}/${formData.id}` : `/api/admin/${activeTab}`;
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({});
        fetchData();
        onUpdate();
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const renderForm = () => {
    switch (activeTab) {
      case 'lessons':
        return (
          <div className="space-y-4">
            <input placeholder="ID (npr. modul-1)" className="admin-input" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} disabled={isEditing} />
            <input placeholder="Naslov" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="number" placeholder="Order" className="admin-input" value={formData.order || ''} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} />
            <input placeholder="Kategorija" className="admin-input" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
            <textarea placeholder="Opis" className="admin-input" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            <textarea placeholder="Sadržaj" className="admin-input" rows={6} value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} />
          </div>
        );
      case 'suppliers':
        return (
          <div className="space-y-4">
            <input placeholder="Naziv" className="admin-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input placeholder="Proizvod" className="admin-input" value={formData.product_name || ''} onChange={e => setFormData({...formData, product_name: e.target.value})} />
            <input placeholder="Slika URL" className="admin-input" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} />
            <input placeholder="Link" className="admin-input" value={formData.buy_link || ''} onChange={e => setFormData({...formData, buy_link: e.target.value})} />
          </div>
        );
      case 'announcements':
        return (
          <div className="space-y-4">
            <input placeholder="Naslov" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input placeholder="Tag (UPDATE, INFO)" className="admin-input" value={formData.tag || ''} onChange={e => setFormData({...formData, tag: e.target.value})} />
            <textarea placeholder="Poruka" className="admin-input" rows={3} value={formData.message || ''} onChange={e => setFormData({...formData, message: e.target.value})} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white">Admin <span className="text-blue-500">Panel</span></h2>
          <p className="text-slate-500 uppercase text-[10px] tracking-widest font-black">Upravljanje HUB sustavom</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          {['lessons', 'suppliers', 'announcements', 'useful', 'users'].map(t => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>{t}</button>
          ))}
        </div>
        {activeTab !== 'users' && (
          <button onClick={() => { setFormData({}); setIsEditing(false); setShowForm(true); }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">+ Novo</button>
        )}
      </div>

      <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="p-6">Identitet</th>
              <th className="p-6">Detalji / Status</th>
              <th className="p-6 text-right">Akcija</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-white/[0.01]">
                <td className="p-6">
                  <p className="font-black text-white">{item.nickname || item.title || item.name}</p>
                  <p className="text-[10px] text-slate-500">{item.email || item.id}</p>
                </td>
                <td className="p-6">
                  {activeTab === 'users' ? (
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${item.isApproved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {item.isApproved ? 'ODOBREN' : 'ČEKA'}
                    </span>
                  ) : (
                    <p className="text-xs text-slate-500 truncate max-w-xs">{item.description || item.category || 'Nema opisa'}</p>
                  )}
                </td>
                <td className="p-6 text-right space-x-2">
                  {activeTab === 'users' && (
                    <button onClick={() => handleToggleApprove(item.id)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${item.isApproved ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 text-white'}`}>
                      {item.isApproved ? 'Onemogući' : 'Odobri'}
                    </button>
                  )}
                  {activeTab !== 'users' && (
                    <button onClick={() => { setFormData(item); setIsEditing(true); setShowForm(true); }} className="p-2 text-blue-400 hover:bg-blue-600/10 rounded-lg">✎</button>
                  )}
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg">✖</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center text-slate-600 animate-pulse font-black uppercase tracking-widest">SINKRONIZACIJA...</div>}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-2xl glass p-10 rounded-[3rem] space-y-8 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-500">✖</button>
            <h3 className="text-3xl font-black text-white uppercase">{isEditing ? 'Uredi' : 'Dodaj'} {activeTab}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderForm()}
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs mt-6">Spremi promjene</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1rem;
          padding: 1rem;
          color: white;
          outline: none;
        }
        .admin-input:focus { border-color: #3b82f6; }
      `}</style>
    </div>
  );
};
