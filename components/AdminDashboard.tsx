
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
        if (Array.isArray(json)) setData(json);
      }
    } catch (e) { console.error(e); }
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
      } else {
        const err = await res.json();
        alert('Greška: ' + err.message);
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
            <input required placeholder="Naslov Lekcije" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input type="number" required placeholder="Redoslijed (Order)" className="admin-input" value={formData.order || ''} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} />
            <input required placeholder="Kategorija" className="admin-input" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
            <input required placeholder="Trajanje (npr. 5 min)" className="admin-input" value={formData.duration || ''} onChange={e => setFormData({...formData, duration: e.target.value})} />
            <textarea required placeholder="Kratki Opis" className="admin-input" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            <textarea required placeholder="Glavni Sadržaj (Markdown)" className="admin-input" rows={8} value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} />
          </>
        );
      case 'suppliers':
        return (
          <>
            <input required placeholder="Ime Dobavljača" className="admin-input" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            <input required placeholder="Ime Proizvoda" className="admin-input" value={formData.product_name || ''} onChange={e => setFormData({...formData, product_name: e.target.value})} />
            <input required placeholder="URL Slike" className="admin-input" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} />
            <input required placeholder="Link za kupnju" className="admin-input" value={formData.buy_link || ''} onChange={e => setFormData({...formData, buy_link: e.target.value})} />
            <label className="flex items-center gap-3 text-white text-xs px-2 cursor-pointer">
              <input type="checkbox" checked={formData.is_whatsapp || false} onChange={e => setFormData({...formData, is_whatsapp: e.target.checked})} className="w-5 h-5 rounded accent-blue-600" />
              <span>WhatsApp Dobavljač?</span>
            </label>
            <textarea placeholder="Opis" className="admin-input" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
          </>
        );
      case 'announcements':
        return (
          <>
            <input required placeholder="Naslov Obavijesti" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input required placeholder="Datum" className="admin-input" value={formData.date || new Date().toLocaleDateString('hr-HR')} onChange={e => setFormData({...formData, date: e.target.value})} />
            <input required placeholder="Tag (UPDATE, EVENT...)" className="admin-input" value={formData.tag || ''} onChange={e => setFormData({...formData, tag: e.target.value})} />
            <input placeholder="URL Slike" className="admin-input" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} />
            <textarea required placeholder="Poruka" className="admin-input" rows={4} value={formData.message || ''} onChange={e => setFormData({...formData, message: e.target.value})} />
          </>
        );
      case 'useful':
        return (
          <>
            <input required placeholder="Naslov Resursa" className="admin-input" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <input required placeholder="Kategorija" className="admin-input" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
            <textarea required placeholder="Kratki Opis" className="admin-input" rows={2} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            <textarea required placeholder="Sadržaj" className="admin-input" rows={8} value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} />
            <input placeholder="Slike (zarezom odvojeni URL-ovi)" className="admin-input" value={formData.images?.join(',') || ''} onChange={e => setFormData({...formData, images: e.target.value.split(',')})} />
          </>
        );
      default: return null;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8">
        <div className="space-y-2">
           <h2 className="text-5xl font-black text-white tracking-tight">Master <span className="text-blue-500">Control</span></h2>
           <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Potpuna administracija sustava</p>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
            {[
              { id: 'lessons', label: 'Lekcije' },
              { id: 'suppliers', label: 'Dobavljači' },
              { id: 'announcements', label: 'Obavijesti' },
              { id: 'useful', label: 'Korisno' },
              { id: 'users', label: 'Korisnici' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id as any); setShowForm(false); setIsEditing(false); }}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {activeTab !== 'users' && (
            <button 
              onClick={() => { setFormData({}); setIsEditing(false); setShowForm(true); }}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
            >
              + Kreiraj Novo
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-[3rem] border border-white/5 overflow-hidden glass shadow-2xl relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <th className="p-8">Informacije / Naziv</th>
                <th className="p-8">Detalji / Status</th>
                <th className="p-8 text-right">Upravljanje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((item: any) => (
                <tr key={item.id} className="group hover:bg-white/[0.01] transition-colors">
                  <td className="p-8">
                    {activeTab === 'users' ? (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center font-black text-blue-500 text-sm border border-blue-600/20">
                          {item.nickname?.charAt(0) || item.email.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-white text-base">@{item.nickname || 'unknown'}</p>
                          <p className="text-xs text-slate-500 font-medium">{item.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="font-black text-white text-lg leading-none">{item.title || item.product_name || item.name}</p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">ID: {item.id}</p>
                      </div>
                    )}
                  </td>
                  <td className="p-8">
                    {activeTab === 'users' ? (
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.isApproved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                          {item.isApproved ? 'ODOBREN' : 'NA ČEKANJU'}
                        </span>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.role}</span>
                      </div>
                    ) : (
                      <div className="max-w-xs">
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed italic">"{item.description || item.message || item.content?.substring(0, 80)}..."</p>
                      </div>
                    )}
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {activeTab === 'users' && item.role !== 'admin' && (
                        <button 
                          onClick={() => toggleApproval(item.id)} 
                          className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${item.isApproved ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}
                        >
                          {item.isApproved ? 'OPOZOVI' : 'ODOBRI'}
                        </button>
                      )}
                      {activeTab !== 'users' && (
                        <button onClick={() => handleEdit(item)} className="p-3 bg-white/5 text-slate-400 hover:text-blue-400 rounded-xl transition-all border border-white/5">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                      <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && !showForm && (
            <div className="p-20 text-center">
               <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
               <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Sinkronizacija...</p>
            </div>
          )}
          {!loading && data.length === 0 && <p className="text-center p-20 text-slate-600 font-bold italic tracking-wide">Baza je prazna za ovu kategoriju.</p>}
        </div>

        {showForm && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl z-50 flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="w-full max-w-3xl bg-slate-900/80 border border-white/10 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(59,130,246,0.1)] relative">
              <button onClick={() => setShowForm(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className="mb-10 text-center">
                 <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{isEditing ? 'Uredi' : 'Dodaj'} <span className="text-blue-500">{activeTab}</span></h3>
                 <p className="text-slate-500 text-xs font-medium mt-2">Svi podaci bit će odmah vidljivi svim članovima nakon spremanja.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                {renderFormFields()}
                <div className="pt-8 flex gap-4">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-5 bg-white/5 text-slate-400 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-white/5 hover:bg-white/10 transition-all">Odustani</button>
                  <button type="submit" disabled={loading} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-600/30 active:scale-95 transition-all">
                    {loading ? 'Spremanje...' : isEditing ? 'Ažuriraj Promjene' : 'Objavi Sadržaj'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .admin-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 1.5rem;
          padding: 1.2rem 1.5rem;
          color: white;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
        }
        .admin-input:focus {
          border-color: #3b82f6;
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
};
