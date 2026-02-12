
import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  token: string;
  onUpdate: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'suppliers' | 'users' | 'useful' | 'announcements'>('lessons');
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
    } catch (e) { console.error("Admin fetch error", e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id: any) => {
    if (!confirm('Sigurno želiš obrisati ovaj unos?')) return;
    try {
      const res = await fetch(`/api/admin/${activeTab}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const handleEdit = (item: any) => {
    setFormData(item);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing ? `/api/admin/${activeTab}/${formData.id}` : `/api/admin/${activeTab}`;
      const method = isEditing ? 'PUT' : 'POST';
      
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
        setFormData({});
        setIsEditing(false);
        fetchData();
        onUpdate();
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleApproval = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/users/approve/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const renderFormFields = () => {
    switch (activeTab) {
      case 'lessons':
        return (
          <>
            <input required placeholder="ID lekcije (npr. intro)" className="admin-input" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} disabled={isEditing} />
            <input required placeholder="Naslov Lekcije" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="number" required placeholder="Redoslijed" className="admin-input" value={formData.order || ''} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} />
            <input required placeholder="Kategorija" className="admin-input" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
            <input required placeholder="Trajanje" className="admin-input" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: e.target.value})} />
            <textarea required placeholder="Opis" className="admin-input" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            <textarea required placeholder="Sadržaj" className="admin-input" rows={8} value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} />
          </>
        );
      case 'suppliers':
        return (
          <>
            <input required placeholder="Naziv dobavljača" className="admin-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input required placeholder="Naziv proizvoda" className="admin-input" value={formData.product_name || ''} onChange={e => setFormData({...formData, product_name: e.target.value})} />
            <input required placeholder="URL slike" className="admin-input" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} />
            <input required placeholder="Link za kupnju" className="admin-input" value={formData.buy_link || ''} onChange={e => setFormData({...formData, buy_link: e.target.value})} />
            <label className="flex items-center gap-2 text-white text-xs px-2"><input type="checkbox" checked={formData.is_whatsapp || false} onChange={e => setFormData({...formData, is_whatsapp: e.target.checked})} /> WhatsApp?</label>
          </>
        );
      default: return <p className="text-white italic">Polja za ovu tablicu bit će dodana uskoro.</p>;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
           <h2 className="text-5xl font-black text-white tracking-tight">Master <span className="text-blue-500">Control</span></h2>
           <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Administracija baze podataka</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
            {['lessons', 'suppliers', 'announcements', 'useful', 'users'].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
          {activeTab !== 'users' && (
            <button onClick={() => { setFormData({}); setIsEditing(false); setShowForm(true); }} className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">+ Novo</button>
          )}
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-[3rem] border border-white/5 overflow-hidden glass shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="p-8">Naziv / Identitet</th>
                <th className="p-8">Status / Detalji</th>
                <th className="p-8 text-right">Akcija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((item: any) => (
                <tr key={item.id} className="hover:bg-white/[0.01]">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center font-black text-blue-500 text-sm">
                        {activeTab === 'users' ? (item.nickname?.charAt(0) || 'U') : '★'}
                      </div>
                      <div>
                        <p className="font-black text-white">{item.nickname || item.title || item.product_name || item.name}</p>
                        <p className="text-[10px] text-slate-500">{item.email || item.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    {activeTab === 'users' ? (
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.isApproved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {item.isApproved ? 'ODOBREN' : 'ČEKA'}
                      </span>
                    ) : (
                      <p className="text-xs text-slate-500 truncate max-w-xs">{item.description || item.category || 'N/A'}</p>
                    )}
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {activeTab === 'users' && (
                        <button onClick={() => toggleApproval(item.id)} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase ${item.isApproved ? 'bg-slate-800 text-slate-400' : 'bg-blue-600 text-white'}`}>
                          {item.isApproved ? 'OPOZOVI' : 'ODOBRI'}
                        </button>
                      )}
                      {activeTab !== 'users' && (
                        <button onClick={() => handleEdit(item)} className="p-3 bg-white/5 text-blue-400 rounded-xl">✎</button>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl">✖</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && <div className="p-20 text-center text-slate-500 font-bold animate-pulse">UČITAVANJE BAZE...</div>}
          {!loading && data.length === 0 && <div className="p-20 text-center text-slate-600 italic">Prazno. Dodajte podatke.</div>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8 backdrop-blur-xl">
          <div className="w-full max-w-3xl glass p-12 rounded-[3rem] relative space-y-8">
            <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white">✖</button>
            <h3 className="text-3xl font-black text-white uppercase">{isEditing ? 'Uredi' : 'Novo'} {activeTab}</h3>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
              {renderFormFields()}
              <div className="pt-6 flex gap-4">
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl">Spremi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1.5rem;
          padding: 1.2rem;
          color: white;
          outline: none;
        }
        .admin-input:focus { border-color: #3b82f6; }
      `}</style>
    </div>
  );
};
