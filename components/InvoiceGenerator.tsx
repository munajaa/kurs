
import React, { useState } from 'react';

type TemplateType = 'istyle' | 'nike' | 'apple';

interface InvoiceItem {
  id: string;
  itemNo: string;
  description: string;
  qty: number;
  unitPrice: number;
  size?: string;
}

export const InvoiceGenerator: React.FC = () => {
  const [template, setTemplate] = useState<TemplateType>('istyle');
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '11-1-' + Math.floor(1000 + Math.random() * 9000),
    salesOrder: '111686' + Math.floor(10 + Math.random() * 90),
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    // Seller Info
    sellerName: 'ISTYLE d.o.o.',
    sellerAddress: 'Ul. Akcije Maslenica 1, 23000, Zadar, Hrvatska',
    sellerId: 'SI17009812',
    businessUnit: 'iSTYLE Supernova Zadar',
    businessUnitDetails: 'zadar@istyle.hr\nUl. Akcije Maslenica 1\n23000, Zadar\nHrvatska\nTelefon: 095 3867 571',
    // Buyer Info
    buyerName: 'Ivan Martinović',
    buyerAddress: 'Ulica Kralja Petra 12',
    buyerCity: '10000 Zagreb',
    buyerCountry: 'Hrvatska',
    buyerId: '',
    paymentMethod: 'Kreditna kartica / Credit Card: Visa',
    currency: 'EUR',
    vatRate: 25,
    shippingCost: 0,
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', itemNo: 'MTJV3ZM/A', description: 'AirPods Pro (2nd Generation) with MagSafe Case (USB‑C)', qty: 1, unitPrice: 239.20, size: '' }
  ]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), itemNo: '', description: '', qty: 1, unitPrice: 0, size: '' }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const calculateTotals = () => {
    const totalNet = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const vat = totalNet * (invoiceData.vatRate / 100);
    const totalPaid = totalNet + vat + invoiceData.shippingCost;
    return {
      totalNet: totalNet.toFixed(2),
      vat: vat.toFixed(2),
      totalPaid: totalPaid.toFixed(2)
    };
  };

  const totals = calculateTotals();

  const handlePrint = () => {
    window.print();
  };

  const switchTemplate = (t: TemplateType) => {
    setTemplate(t);
    if (t === 'nike') {
      setInvoiceData(prev => ({
        ...prev,
        sellerName: 'Nike Retail B.V.',
        sellerAddress: 'Colosseum 1, 1213 NL Hilversum',
        buyerCountry: 'The Netherlands',
        sellerId: 'NL803730704B01',
        paymentMethod: 'Visa Card ending in 4242',
        vatRate: 25
      }));
    } else if (t === 'apple') {
      setInvoiceData(prev => ({
        ...prev,
        sellerName: 'Apple Distribution International Ltd.',
        sellerAddress: 'Hollyhill Industrial Estate, Hollyhill',
        buyerCountry: 'Cork, Ireland',
        sellerId: 'IE9700053D',
        paymentMethod: 'Apple Pay (Mastercard **** 8812)',
        vatRate: 21
      }));
    } else {
      setInvoiceData(prev => ({
        ...prev,
        sellerName: 'ISTYLE d.o.o.',
        sellerAddress: 'Ul. Akcije Maslenica 1, 23000, Zadar',
        buyerCountry: 'Hrvatska',
        sellerId: 'SI17009812',
        paymentMethod: 'Kreditna kartica / Credit Card: Visa',
        vatRate: 25
      }));
    }
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Settings Form */}
      <div className="bg-slate-900/50 p-8 md:p-12 rounded-[3rem] border border-white/10 no-print animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-tight">Invoice <span className="text-blue-500">Master</span></h2>
            <p className="text-slate-400 text-sm">Prilagodi svaki detalj za profesionalni iSTYLE, Nike ili Apple račun.</p>
          </div>
          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
            {(['istyle', 'nike', 'apple'] as TemplateType[]).map(t => (
              <button 
                key={t}
                onClick={() => switchTemplate(t)}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${template === t ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          {/* Seller Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Prodavač</h4>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Naziv / Name</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all" value={invoiceData.sellerName} onChange={e => setInvoiceData({...invoiceData, sellerName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Adresa / Address</label>
                <textarea rows={2} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all" value={invoiceData.sellerAddress} onChange={e => setInvoiceData({...invoiceData, sellerAddress: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">OIB / VAT ID</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all" value={invoiceData.sellerId} onChange={e => setInvoiceData({...invoiceData, sellerId: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Buyer Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-600/10 flex items-center justify-center text-green-500 border border-green-500/10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Kupac</h4>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ime i Prezime</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all" value={invoiceData.buyerName} onChange={e => setInvoiceData({...invoiceData, buyerName: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ulica i Broj</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all" value={invoiceData.buyerAddress} onChange={e => setInvoiceData({...invoiceData, buyerAddress: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Grad</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all" value={invoiceData.buyerCity} onChange={e => setInvoiceData({...invoiceData, buyerCity: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Država</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-blue-500 outline-none transition-all" value={invoiceData.buyerCountry} onChange={e => setInvoiceData({...invoiceData, buyerCountry: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-500 border border-purple-500/10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest">Informacije</h4>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Broj Računa</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={invoiceData.invoiceNumber} onChange={e => setInvoiceData({...invoiceData, invoiceNumber: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Order ID</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={invoiceData.salesOrder} onChange={e => setInvoiceData({...invoiceData, salesOrder: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Datum</label>
                  <input type="date" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">PDV (%)</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={invoiceData.vatRate} onChange={e => setInvoiceData({...invoiceData, vatRate: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Metoda Plaćanja</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm" value={invoiceData.paymentMethod} onChange={e => setInvoiceData({...invoiceData, paymentMethod: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        {/* Product Items Table */}
        <div className="space-y-6 mb-12 bg-white/5 p-8 rounded-[2rem] border border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Stavke Proizvoda</h3>
            <button onClick={addItem} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">+ Dodaj</button>
          </div>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-slate-900/80 border border-white/10 rounded-2xl items-end group transition-all hover:border-blue-500/50">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">SKU / Model</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs" value={item.itemNo} onChange={e => updateItem(item.id, 'itemNo', e.target.value)} />
                </div>
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Opis Artikla</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                </div>
                {template === 'nike' && (
                  <div className="md:col-span-1 space-y-1">
                    <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Size</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs" value={item.size} onChange={e => updateItem(item.id, 'size', e.target.value)} />
                  </div>
                )}
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Kol.</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value))} />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Cijena (Neto)</label>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))} />
                </div>
                <div className="md:col-span-1">
                  <button onClick={() => removeItem(item.id)} className="w-full p-2.5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-500/10">
                    <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handlePrint} className="w-full py-7 bg-white text-black font-black rounded-3xl hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex items-center justify-center gap-4 text-xl tracking-tighter group">
          <svg className="w-7 h-7 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
          PRIPREMI ZA ISPIS / PDF
        </button>
      </div>

      {/* --- PREVIEW RENDERER --- */}
      <div className="flex justify-center p-4">
        {template === 'istyle' && (
          <div className="invoice-preview bg-white text-black p-[1.8cm] mx-auto shadow-2xl overflow-hidden border border-gray-100" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            {/* iSTYLE Authenticity Details */}
            <div className="flex justify-between items-start mb-20">
              <h1 className="text-4xl font-bold tracking-tighter">RAČUN / INVOICE</h1>
              <div className="flex items-center gap-5">
                 <div className="text-5xl font-black italic tracking-tighter">iSTYLE</div>
                 <div className="h-10 w-[1.5px] bg-black"></div>
                 <div className="text-[11px] font-bold uppercase leading-tight">Authorized<br/>Reseller</div>
                 <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                   <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-12 mb-14 border-t-2 border-black pt-8 text-[11px]">
              <div className="space-y-1.5">
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Prodavač / Seller:</p>
                <p className="font-bold text-[15px]">{invoiceData.sellerName}</p>
                <p className="leading-relaxed">{invoiceData.sellerAddress}</p>
                <p className="font-bold mt-3 border-t border-gray-100 pt-2">ID za DDV: {invoiceData.sellerId}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Poslovna jedinica / Business unit:</p>
                <p className="font-bold text-[15px]">{invoiceData.businessUnit}</p>
                <p className="leading-relaxed whitespace-pre-wrap">{invoiceData.businessUnitDetails}</p>
              </div>
              <div className="space-y-1.5">
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Kupac / Customer:</p>
                <p className="font-bold text-[15px]">{invoiceData.buyerName}</p>
                <p className="leading-relaxed text-gray-700">{invoiceData.buyerAddress}</p>
                <p className="leading-relaxed text-gray-700">{invoiceData.buyerCity}</p>
                <p className="leading-relaxed font-bold">{invoiceData.buyerCountry}</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 border-t-2 border-black border-b-2 py-8 mb-14 text-[11px]">
              <div><p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Sales Order:</p><p className="font-bold text-[14px]">{invoiceData.salesOrder}</p></div>
              <div><p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Invoice Date/Place:</p><p className="font-bold text-[14px]">{invoiceData.date} {invoiceData.buyerCity.split(' ').pop()}</p></div>
              <div><p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Due Date:</p><p className="font-bold text-[14px]">{invoiceData.dueDate}</p></div>
              <div><p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Invoice Number:</p><p className="font-bold text-2xl tracking-tighter">{invoiceData.invoiceNumber}</p></div>
            </div>

            <div className="mb-14 text-[12px]">
              <p className="text-gray-400 text-[10px] uppercase font-bold mb-1">Način plačila / Payment</p>
              <p>mode: {invoiceData.paymentMethod}</p>
              <div className="flex justify-between mt-4 font-bold border-b-2 border-gray-100 pb-3 text-[14px]">
                <span className="uppercase tracking-widest">Transfer</span>
                <span className="uppercase tracking-widest">Visa</span>
                <span className="text-lg">{totals.totalPaid} EUR</span>
              </div>
            </div>

            <table className="w-full text-[12px] mb-20">
              <thead className="border-b-2 border-gray-300 text-left">
                <tr className="text-gray-400 uppercase text-[10px] font-bold">
                  <th className="py-3">Poz:</th>
                  <th className="py-3">Item No.:</th>
                  <th className="py-3">Description:</th>
                  <th className="py-3">Qty:</th>
                  <th className="py-3">Unit Price:</th>
                  <th className="py-3 text-right">Net value:</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-5">{idx + 1}</td>
                    <td className="py-5 font-bold">{item.itemNo}</td>
                    <td className="py-5 text-gray-800">{item.description}</td>
                    <td className="py-5 font-bold">{(item.qty).toFixed(2)}</td>
                    <td className="py-5">{(item.unitPrice).toFixed(2)}</td>
                    <td className="py-5 text-right font-black">{(item.qty * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="w-[10cm] ml-auto space-y-3 text-[13px] border-t-4 border-black pt-8">
              <div className="flex justify-between items-center"><span className="uppercase font-bold text-gray-500 text-[11px]">Total Net:</span><span className="font-bold">EUR {totals.totalNet}</span></div>
              <div className="flex justify-between items-center"><span className="uppercase font-bold text-gray-500 text-[11px]">Total VAT base:</span><span className="font-bold">EUR {totals.totalNet}</span></div>
              <div className="flex justify-between items-center"><span className="uppercase font-bold text-gray-500 text-[11px]">Total VAT ({invoiceData.vatRate}%):</span><span className="font-bold">EUR {totals.vat}</span></div>
              <div className="flex justify-between border-t-2 border-black pt-5 text-[16px] font-black uppercase tracking-tight"><span>Total to be paid:</span><span>EUR {totals.totalPaid}</span></div>
            </div>
            
            <div className="mt-auto flex justify-between items-end pt-32">
               <div className="flex gap-6">
                  <div className="w-24 h-24 bg-white border-2 border-gray-100 flex flex-col items-center justify-center p-2">
                    <div className="w-full h-full bg-slate-100/50 flex items-center justify-center text-[9px] text-gray-300 font-bold uppercase tracking-widest text-center">QR FISKAL</div>
                  </div>
                  <div className="w-24 h-24 bg-white border-2 border-gray-100 flex flex-col items-center justify-center p-2">
                    <div className="w-full h-full bg-slate-100/50 flex items-center justify-center text-[9px] text-gray-300 font-bold uppercase tracking-widest text-center">QR CODE</div>
                  </div>
               </div>
               <p className="font-black text-3xl tracking-tighter uppercase mb-2">{invoiceData.sellerName}</p>
            </div>
          </div>
        )}

        {template === 'nike' && (
          <div className="invoice-preview bg-white text-black p-[2cm] mx-auto overflow-hidden shadow-sm" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Futura, "Helvetica Neue", Arial, sans-serif' }}>
            {/* Nike Packing Slip & Invoice Style */}
            <div className="flex justify-between items-start mb-24 border-b-4 border-black pb-8">
              <div className="space-y-4">
                <svg width="120" height="42" viewBox="0 0 100 35" fill="black">
                  <path d="M100 2.2L32.2 24.3C26.1 26.3 19.1 23.3 16.5 17.5C14.2 12.3 16.2 6.3 21.2 3.6L24.5 1.8L21.7 0C11.6 1.1 2.3 7.8 0.4 17.5C-1.5 27.2 4.1 35.8 13.1 35.8L100 2.2Z"/>
                </svg>
                <div className="bg-black text-white px-3 py-1 text-[11px] font-black italic uppercase tracking-tighter inline-block">Official Packing Slip / Invoice</div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black italic uppercase leading-none mb-3">INVOICE</h2>
                <div className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">
                  <p className="mb-1">Date: {invoiceData.date}</p>
                  <p className="mb-1">Order #: {invoiceData.salesOrder}</p>
                  <p>Invoice #: {invoiceData.invoiceNumber}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-24 mb-24 text-[13px]">
              <div>
                <h4 className="font-black uppercase mb-4 text-[11px] tracking-[0.2em] text-gray-400">Shipped From</h4>
                <div className="space-y-1">
                  <p className="font-black text-[16px] mb-2">{invoiceData.sellerName}</p>
                  <p className="text-gray-600 leading-relaxed font-bold">{invoiceData.sellerAddress}</p>
                  <p className="text-gray-600 font-bold uppercase">{invoiceData.buyerCountry}</p>
                  <div className="mt-6 pt-4 border-t-2 border-gray-50">
                    <p className="font-black uppercase text-[10px] text-gray-300 tracking-widest">VAT REGISTRATION</p>
                    <p className="font-black text-[14px]">{invoiceData.sellerId}</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-black uppercase mb-4 text-[11px] tracking-[0.2em] text-gray-400">Ship To</h4>
                <div className="space-y-1">
                  <p className="font-black text-[16px] mb-2">{invoiceData.buyerName}</p>
                  <p className="text-gray-600 leading-relaxed font-bold">{invoiceData.buyerAddress}</p>
                  <p className="text-gray-600 font-bold uppercase">{invoiceData.buyerCity}</p>
                  <p className="text-gray-600 font-bold uppercase">{invoiceData.buyerCountry}</p>
                  <div className="mt-6 pt-4 border-t-2 border-gray-50">
                    <p className="font-black uppercase text-[10px] text-gray-300 tracking-widest">PAYMENT METHOD</p>
                    <p className="font-black text-[14px]">{invoiceData.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-20">
              <table className="w-full text-[13px]">
                <thead className="bg-gray-100 border-t-2 border-b-2 border-black">
                  <tr className="text-left font-black uppercase text-[11px] tracking-[0.1em]">
                    <th className="p-5">Description</th>
                    <th className="p-5">SKU / Model</th>
                    <th className="p-5">Size</th>
                    <th className="p-5 text-center">Qty</th>
                    <th className="p-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="p-5">
                        <p className="font-black uppercase italic">{item.description}</p>
                      </td>
                      <td className="p-5 font-mono text-gray-400 font-bold">{item.itemNo}</td>
                      <td className="p-5 font-black">{item.size || 'N/A'}</td>
                      <td className="p-5 text-center font-bold">{item.qty}</td>
                      <td className="p-5 text-right font-black">{(item.qty * item.unitPrice).toFixed(2)} EUR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pr-5">
              <div className="w-[10cm] space-y-5 text-[14px]">
                <div className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="uppercase text-gray-400 font-black tracking-widest text-[11px]">Subtotal</span>
                  <span className="font-black">{totals.totalNet} EUR</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-3">
                  <span className="uppercase text-gray-400 font-black tracking-widest text-[11px]">Shipping</span>
                  <span className="font-black text-green-600 uppercase italic">FREE SHIPPING</span>
                </div>
                <div className="flex justify-between border-b border-gray-50 pb-3 text-gray-300">
                  <span className="uppercase text-[11px] font-bold">VAT ({invoiceData.vatRate}%)</span>
                  <span className="font-bold">{totals.vat} EUR</span>
                </div>
                <div className="flex justify-between font-black text-3xl pt-6">
                  <span className="italic uppercase tracking-tighter">Total Amount</span>
                  <span className="tracking-tight">{totals.totalPaid} EUR</span>
                </div>
              </div>
            </div>

            <div className="mt-auto text-[11px] text-gray-400 border-t-4 border-black pt-12 italic">
              <p className="leading-relaxed mb-6 font-bold uppercase tracking-tighter">Returns must be made within 30 days of shipment date. Products must be in original condition with tags attached. For more information, visit nike.com/help</p>
              <div className="flex gap-10 font-black uppercase tracking-widest text-[10px]">
                <span className="border-b border-gray-200 pb-1">NIKE.COM</span>
                <span className="border-b border-gray-200 pb-1">@NIKE</span>
                <span className="border-b border-gray-200 pb-1">JUST DO IT.</span>
              </div>
            </div>
          </div>
        )}

        {template === 'apple' && (
          <div className="invoice-preview bg-white text-black p-[2cm] mx-auto overflow-hidden shadow-sm" style={{ width: '210mm', minHeight: '297mm', fontFamily: '-apple-system, "SF Pro Text", Helvetica, sans-serif' }}>
            {/* Apple Luxury Minimalist Header */}
            <div className="flex justify-between items-start mb-28">
              <div className="space-y-10">
                <svg width="50" height="50" viewBox="0 0 384 512" fill="black">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-19-84.1-19C61 142 0 183.2 0 252c0 43.3 12.1 82.3 35.1 123.6 15.6 27.8 45 54.6 74.3 54.6 14.8 0 26.5-5.3 43-5.3s30.1 5.3 43.6 5.3c29.3 0 54.1-23.8 73-51.9 22.1-31.9 31.1-62.8 31.1-64.4 0-1.1-41.4-15.9-41.4-65.2zM212 90c15.6-18.4 25.1-43.7 22.2-69-23.7 1-52.6 15.6-69.6 35.1-15.1 17.5-28.3 42.9-24.8 67.5 26.2 2 54.4-15.2 72.2-33.6z"/>
                </svg>
                <div className="space-y-1">
                  <h1 className="text-4xl font-semibold tracking-tight">Invoice</h1>
                  <p className="text-gray-400 text-base font-medium">Apple Order Confirmation</p>
                </div>
              </div>
              <div className="text-right pt-4 space-y-6">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Invoice Number</p>
                  <p className="text-xl font-bold tracking-tight">{invoiceData.invoiceNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em]">Order Number</p>
                  <p className="text-sm font-bold tracking-tight">{invoiceData.salesOrder}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-20 mb-28 text-[14px] leading-relaxed">
              <div className="space-y-8">
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.15em] mb-3">Sold To</h4>
                  <p className="font-bold text-[17px] tracking-tight">{invoiceData.buyerName}</p>
                  <p className="text-gray-600 font-medium">{invoiceData.buyerAddress}</p>
                  <p className="text-gray-600 font-medium">{invoiceData.buyerCity}</p>
                  <p className="text-gray-800 font-bold">{invoiceData.buyerCountry}</p>
                </div>
                <div className="pt-6 border-t border-gray-100">
                   <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.15em] mb-2">Invoice Date</h4>
                   <p className="font-bold text-[15px]">{new Date(invoiceData.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.15em] mb-3">Supplier</h4>
                  <p className="font-bold text-[17px] tracking-tight">{invoiceData.sellerName}</p>
                  <p className="text-gray-600 font-medium whitespace-pre-wrap">{invoiceData.sellerAddress}</p>
                  <p className="text-gray-800 font-bold uppercase">{invoiceData.buyerCountry}</p>
                  <div className="mt-4 flex gap-4 text-[13px] pt-4 border-t border-gray-50">
                    <div><span className="text-gray-400 font-medium">VAT ID:</span> <span className="font-bold tracking-tight">{invoiceData.sellerId}</span></div>
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100">
                   <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-[0.15em] mb-2">Payment Details</h4>
                   <p className="font-bold text-[15px]">{invoiceData.paymentMethod}</p>
                </div>
              </div>
            </div>

            <div className="mb-24">
              <table className="w-full text-[14px]">
                <thead className="border-b border-gray-100">
                  <tr className="text-left text-gray-300 font-semibold tracking-tight">
                    <th className="py-6 font-semibold">Description</th>
                    <th className="py-6 font-semibold">Part Number</th>
                    <th className="py-6 font-semibold">Qty</th>
                    <th className="py-6 font-semibold text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="py-10">
                        <p className="font-bold text-[17px] tracking-tight mb-2">{item.description}</p>
                        <p className="text-[12px] text-gray-400 font-medium">Dispatched within 24 hours</p>
                      </td>
                      <td className="py-10 text-gray-500 font-mono text-[13px] font-bold">{item.itemNo}</td>
                      <td className="py-10 font-bold text-[15px]">{item.qty}</td>
                      <td className="py-10 text-right font-bold text-[17px]">{(item.qty * item.unitPrice).toFixed(2)} EUR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="w-[10cm] ml-auto space-y-6 text-[15px]">
              <div className="flex justify-between items-center text-gray-400 font-medium">
                <span>Subtotal (Net)</span>
                <span className="font-bold text-black">{totals.totalNet} EUR</span>
              </div>
              <div className="flex justify-between items-center text-gray-400 font-medium">
                <span>VAT ({invoiceData.vatRate}%)</span>
                <span className="font-bold text-black">{totals.vat} EUR</span>
              </div>
              <div className="flex justify-between items-center text-3xl font-bold border-t-2 border-gray-100 pt-8 tracking-tighter">
                <span>Total</span>
                <span>{totals.totalPaid} EUR</span>
              </div>
            </div>

            <div className="mt-auto pt-24 text-[11px] text-gray-400 leading-relaxed border-t border-gray-50 font-medium">
              <p>Apple Distribution International Ltd. is regulated by the Central Bank of Ireland. Registered in Ireland, No. 240673. Registered Office: Hollyhill Industrial Estate, Cork, Ireland.</p>
              <p className="mt-6 text-[10px]">For order status and support, visit apple.com/support. Payment processed securely via Apple Pay Services.</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media screen {
          .invoice-preview {
            transform: scale(0.95);
            transform-origin: top center;
            border-radius: 12px;
            box-shadow: 0 50px 100px -20px rgba(0,0,0,0.6);
          }
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0;
          }
          .mesh-gradient, .orb, #root > header, #root > main > div > .no-print, footer, header {
            display: none !important;
          }
          .invoice-preview {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 1.5cm !important;
            box-shadow: none !important;
            transform: none !important;
            border: none !important;
            visibility: visible !important;
          }
          #root > main {
            padding: 0 !important;
            max-width: none !important;
          }
          #root {
            padding: 0 !important;
          }
        }
        .invoice-preview {
          background-color: white;
          color: black;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        input, textarea {
          transition: border-color 0.2s;
        }
      `}</style>
    </div>
  );
};
