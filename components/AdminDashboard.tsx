
import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  token: string;
  onUpdate: () => void;
}

type Tab = 'users' | 'lessons' | 'suppliers' | 'announcements' | 'useful';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleDelete = async (id: any) => {
    if (!confirm('Obrisati trajno?')) return;
    try {
      await fetch(`/api/admin/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
      onUpdate();
    } catch (e) { console.error(e); }
  };

  const handleToggleApprove = async (id: any) => {
    try {
      await fetch(`/api/admin/users/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/admin/${activeTab}/${editingId}` : `/api/admin/${activeTab}`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({});
        fetchData();
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setFormData(item);
    setShowForm(true);
  };

  const renderInputs = () => {
    if (activeTab === 'lessons') return (
      <>
        <input placeholder="ID (npr. modul-1)" className="admin-input" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} disabled={!!editingId} />
        <input placeholder="Naslov" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
        <input placeholder="Kategorija" className="admin-input" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
        <input placeholder="Trajanje" className="admin-input" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: e.target.value})} />
        <input placeholder="Poredak (broj)" type="number" className="admin-input" value={formData.order || ''} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} />
        <textarea placeholder="Opis" className="admin-input" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
        <textarea placeholder="Sadržaj (Markdown)" className="admin-input" rows={8} value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} />
      </>
    );
    if (activeTab === 'suppliers') return (
      <>
        <input placeholder="Ime Dobavljača" className="admin-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
        <input placeholder="Proizvod" className="admin-input" value={formData.product_name || ''} onChange={e => setFormData({...formData, product_name: e.target.value})} />
        <input placeholder="URL Slike" className="admin-input" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} />
        <input placeholder="Buy Link" className="admin-input" value={formData.buy_link || ''} onChange={e => setFormData({...formData, buy_link: e.target.value})} />
        <label className="flex items-center gap-2 text-white text-xs px-2"><input type="checkbox" checked={formData.is_whatsapp} onChange={e => setFormData({...formData, is_whatsapp: e.target.checked})} /> WhatsApp Dobavljač?</label>
      </>
    );
    if (activeTab === 'announcements') return (
      <>
        <input placeholder="Naslov" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
        <input placeholder="Datum (npr. 25. Svibnja)" className="admin-input" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
        <input placeholder="Tag (UPDATE, INFO)" className="admin-input" value={formData.tag || ''} onChange={e => setFormData({...formData, tag: e.target.value})} />
        <textarea placeholder="Poruka" className="admin-input" rows={4} value={formData.message || ''} onChange={e => setFormData({...formData, message: e.target.value})} />
      </>
    );
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in max-w-7xl mx-auto py-10">
      <div className="w-full lg:w-64 space-y-2 shrink-0">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4 mb-4">Command Center</h3>
        {(['users', 'lessons', 'suppliers', 'announcements', 'useful'] as Tab[]).map(t => (
          <button key={t} onClick={() => setActiveTab(t)} className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      <div className="flex-grow space-y-6">
        <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">{activeTab}</h2>
          {activeTab !== 'users' && (
            <button onClick={() => { setEditingId(null); setFormData({}); setShowForm(true); }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">+ Dodaj Novo</button>
          )}
        </div>

        <div className="glass rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl min-h-[500px]">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="p-8">Identitet</th>
                <th className="p-8">Status / Detalji</th>
                <th className="p-8 text-right">Akcija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="p-8">
                    <p className="font-black text-white text-base">{item.nickname || item.title || item.name || 'N/A'}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{item.email || item.id}</p>
                  </td>
                  <td className="p-8">
                    {activeTab === 'users' ? (
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black ${item.isApproved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {item.isApproved ? 'AKTIVAN' : 'NA ČEKANJU'}
                      </span>
                    ) : (
                      <p className="text-xs text-slate-400 truncate max-w-xs">{item.description || item.message || '-'}</p>
                    )}
                  </td>
                  <td className="p-8 text-right space-x-2">
                    {activeTab === 'users' ? (
                      <button onClick={() => handleToggleApprove(item.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${item.isApproved ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 text-white'}`}>{item.isApproved ? 'Deaktiviraj' : 'Odobri'}</button>
                    ) : (
                      <>
                        <button onClick={() => openEdit(item)} className="p-3 text-blue-400 hover:bg-blue-600/10 rounded-xl transition-all">✎</button>
                        <button onClick={() => handleDelete(item.id)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all">✖</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Sinkronizacija baze...</div>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl glass p-10 rounded-[3.5rem] border border-white/10 shadow-3xl space-y-8 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h3 className="text-3xl font-black text-white uppercase tracking-tight">{editingId ? 'Uredi' : 'Stvori'} {activeTab}</h3>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {renderInputs()}
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all mt-6">Spremi promjene</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-input { width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 1.25rem; padding: 1.25rem; color: white; outline: none; transition: all 0.2s; font-size: 0.9rem; }
        .admin-input:focus { border-color: #3b82f6; background: rgba(255,255,255,0.06); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};
