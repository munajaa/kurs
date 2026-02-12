
import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  token: string;
  onUpdate: () => void;
}

type AdminTab = 'users' | 'lessons' | 'suppliers' | 'announcements' | 'useful';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setItems(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleDelete = async (id: any) => {
    if (!confirm('Obrisati trajno?')) return;
    try {
      const res = await fetch(`/api/admin/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleToggleApprove = async (id: any) => {
    try {
      const res = await fetch(`/api/admin/users/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? 'PUT' : 'POST';
    const url = editingItem ? `/api/admin/${activeTab}/${editingItem.id}` : `/api/admin/${activeTab}`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setEditingItem(null);
        setFormData({});
        fetchData();
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const renderFields = () => {
    if (activeTab === 'lessons') return (
      <>
        <input placeholder="ID (npr. modul-10)" className="admin-input" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} />
        <input placeholder="Naslov" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
        <input placeholder="Redoslijed (broj)" type="number" className="admin-input" value={formData.order || ''} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} />
        <input placeholder="Trajanje" className="admin-input" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: e.target.value})} />
        <input placeholder="Kategorija" className="admin-input" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
        <textarea placeholder="Opis" className="admin-input" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
        <textarea placeholder="Sadržaj (Markdown/Text)" className="admin-input" rows={10} value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} />
      </>
    );
    if (activeTab === 'suppliers') return (
      <>
        <input placeholder="Naziv" className="admin-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
        <input placeholder="Proizvod" className="admin-input" value={formData.product_name || ''} onChange={e => setFormData({...formData, product_name: e.target.value})} />
        <input placeholder="Slika URL" className="admin-input" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} />
        <input placeholder="Link" className="admin-input" value={formData.buy_link || ''} onChange={e => setFormData({...formData, buy_link: e.target.value})} />
      </>
    );
    if (activeTab === 'announcements') return (
      <>
        <input placeholder="Naslov" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
        <input placeholder="Tag (UPDATE, INFO)" className="admin-input" value={formData.tag || ''} onChange={e => setFormData({...formData, tag: e.target.value})} />
        <textarea placeholder="Poruka" className="admin-input" value={formData.message || ''} onChange={e => setFormData({...formData, message: e.target.value})} />
      </>
    );
    return null;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      {/* Sidebar unutar Dashboarda */}
      <div className="w-full lg:w-64 space-y-2">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-4 mb-4">Master Control</h3>
        {(['users', 'lessons', 'suppliers', 'announcements', 'useful'] as AdminTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-grow space-y-6">
        <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/5">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{activeTab}</h2>
          {activeTab !== 'users' && (
            <button onClick={() => { setEditingItem(null); setFormData({}); setShowForm(true); }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg">Nova stavka</button>
          )}
        </div>

        <div className="glass rounded-[2rem] overflow-hidden border border-white/5">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="p-6">Ime / Naslov</th>
                <th className="p-6">Status / Detalji</th>
                <th className="p-6 text-right">Akcija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-6">
                    <p className="font-black text-white">{item.nickname || item.title || item.name}</p>
                    <p className="text-[10px] text-slate-500">{item.email || item.id}</p>
                  </td>
                  <td className="p-6">
                    {activeTab === 'users' ? (
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black ${item.isApproved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {item.isApproved ? 'ODOBREN' : 'NA ČEKANJU'}
                      </span>
                    ) : (
                      <p className="text-xs text-slate-400 truncate max-w-xs">{item.description || item.category || '-'}</p>
                    )}
                  </td>
                  <td className="p-6 text-right space-x-2">
                    {activeTab === 'users' && (
                      <button onClick={() => handleToggleApprove(item.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${item.isApproved ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 text-white'}`}>
                        {item.isApproved ? 'Blokiraj' : 'Odobri'}
                      </button>
                    )}
                    {activeTab !== 'users' && (
                      <button onClick={() => { setEditingItem(item); setFormData(item); setShowForm(true); }} className="p-2 text-blue-400 hover:bg-blue-600/10 rounded-lg transition-all">✎</button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">✖</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Sinkronizacija...</div>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-2xl glass p-10 rounded-[3rem] space-y-6 relative border border-white/10 shadow-2xl">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">✖</button>
            <h3 className="text-2xl font-black text-white uppercase tracking-tight">{editingItem ? 'Uredi' : 'Dodaj'} {activeTab}</h3>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
              {renderFields()}
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">Spremi promjene</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1.25rem;
          padding: 1.2rem;
          color: white;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.2s;
        }
        .admin-input:focus { border-color: #3b82f6; background: rgba(255,255,255,0.06); }
      `}</style>
    </div>
  );
};
