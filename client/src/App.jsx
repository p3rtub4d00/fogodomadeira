import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Package, ShoppingCart, FileSignature, Wallet, MessageCircle, CheckCircle2 } from 'lucide-react';

// Em produção frontend e API são servidos pelo mesmo domínio do Render.\nconst API = import.meta.env.VITE_API_URL || '/api';
const money = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function SignaturePad({ onChange }) {
  const ref = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';

    const point = (e) => {
      const rect = canvas.getBoundingClientRect();
      const p = e.touches?.[0] || e;
      return { x: (p.clientX - rect.left) * (canvas.width / rect.width), y: (p.clientY - rect.top) * (canvas.height / rect.height) };
    };
    const start = (e) => { drawing.current = true; const p = point(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const move = (e) => { if (!drawing.current) return; const p = point(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const end = () => { if (!drawing.current) return; drawing.current = false; onChange(canvas.toDataURL('image/png')); };

    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, { passive: false }); canvas.addEventListener('touchmove', move, { passive: false }); canvas.addEventListener('touchend', end);
    return () => { window.removeEventListener('mouseup', end); };
  }, [onChange]);

  const clear = () => {
    const canvas = ref.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return <div><canvas ref={ref} width="700" height="220" className="signature" /><button className="ghost" type="button" onClick={clear}>Limpar assinatura</button></div>;
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [items, setItems] = useState([]);
  const [termDays, setTermDays] = useState(7);
  const [signature, setSignature] = useState('');
  const [lastSale, setLastSale] = useState(null);
  const [notice, setNotice] = useState('');

  const load = async () => {
    const [c, p, s] = await Promise.all([
      fetch(`${API}/clients`).then(r => r.json()),
      fetch(`${API}/products`).then(r => r.json()),
      fetch(`${API}/sales`).then(r => r.json())
    ]);
    setClients(c); setProducts(p); setSales(s);
  };
  useEffect(() => { load().catch(() => setNotice('Não foi possível conectar ao servidor.')); }, []);

  const pending = sales.filter(s => s.status === 'PENDENTE');
  const totalOpen = pending.reduce((a, s) => a + s.total, 0);
  const totalPaid = sales.filter(s => s.status === 'PAGO').reduce((a, s) => a + s.total, 0);
  const saleTotal = useMemo(() => items.reduce((sum, item) => {
    const p = products.find(x => x.id === item.productId);
    return sum + (p?.price || 0) * Number(item.qty || 1);
  }, 0), [items, products]);

  const createClient = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`${API}/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return setNotice(data.message);
    e.currentTarget.reset(); setNotice('Cliente cadastrado com sucesso.'); await load();
  };

  const createProduct = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    body.price = Number(String(body.price).replace(',', '.'));
    const res = await fetch(`${API}/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return setNotice(data.message);
    e.currentTarget.reset(); setNotice('Produto cadastrado.'); await load();
  };

  const addProduct = (productId) => {
    const existing = items.find(i => i.productId === productId);
    if (existing) setItems(items.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i));
    else setItems([...items, { productId, qty: 1 }]);
  };

  const finalizeSale = async () => {
    const res = await fetch(`${API}/sales`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selectedClient, items, termDays: Number(termDays), signatureDataUrl: signature })
    });
    const data = await res.json();
    if (!res.ok) return setNotice(data.message);
    setLastSale(data); setNotice('Venda finalizada e promissória criada.'); setItems([]); setSignature(''); await load();
  };

  const shareWhatsApp = (sale) => {
    const phone = String(sale.client.whatsapp || '').replace(/\D/g, '');
    const due = new Date(sale.dueAt).toLocaleDateString('pt-BR');
    const text = `Olá, ${sale.client.name}. Sua compra foi registrada. Valor: ${money(sale.total)}. Vencimento: ${due}. Pix simulado: ${sale.payment.pixCopyPaste}`;
    window.open(`https://wa.me/55${phone.replace(/^55/, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const markPaid = async (sale) => {
    await fetch(`${API}/sales/${sale.id}/pay-simulation`, { method: 'POST' });
    setNotice('Pagamento marcado como PAGO em modo de simulação.'); await load();
  };

  return <div className="app-shell">
    <aside>
      <div className="brand"><div className="brand-mark">FM</div><div><strong>Fogo do Madeira</strong><span>Gestão de vendas a prazo</span></div></div>
      <nav>
        {[['dashboard','Visão geral',Wallet],['clients','Clientes',Users],['products','Produtos',Package],['sales','Nova venda',ShoppingCart],['promissory','Promissórias',FileSignature]].map(([id,label,Icon]) => (
          <button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={18}/>{label}</button>
        ))}
      </nav>
      <div className="simulation-badge">MODO DE TESTE<br/><small>Sem MongoDB • Pix simulado</small></div>
    </aside>

    <main>
      <header><div><h1>{tab==='dashboard'?'Visão geral':tab==='clients'?'Clientes':tab==='products'?'Produtos':tab==='sales'?'Nova venda':'Promissórias'}</h1><p>Protótipo funcional para validação do fluxo.</p></div></header>
      {notice && <div className="notice" onClick={()=>setNotice('')}>{notice}</div>}

      {tab==='dashboard' && <>
        <section className="cards">
          <div className="stat"><span>Clientes</span><strong>{clients.length}</strong></div>
          <div className="stat"><span>Vendas</span><strong>{sales.length}</strong></div>
          <div className="stat"><span>Em aberto</span><strong>{money(totalOpen)}</strong></div>
          <div className="stat"><span>Recebido</span><strong>{money(totalPaid)}</strong></div>
        </section>
        <section className="panel"><h2>Últimas vendas</h2><SalesTable sales={sales.slice().reverse().slice(0,8)} onShare={shareWhatsApp} onPay={markPaid}/></section>
      </>}

      {tab==='clients' && <div className="two-cols">
        <section className="panel"><h2>Novo cliente</h2><form className="form-grid" onSubmit={createClient}>
          <label>Nome / Razão social<input name="name" required/></label><label>CPF / CNPJ<input name="document" required/></label>
          <label>Telefone<input name="phone"/></label><label>WhatsApp<input name="whatsapp" required placeholder="69999999999"/></label>
          <label>Rua<input name="street"/></label><label>Número<input name="number"/></label><label>Bairro<input name="neighborhood"/></label>
          <label>Cidade<input name="city"/></label><label>Estado<input name="state"/></label><label>CEP<input name="zipCode"/></label>
          <button className="primary full">Cadastrar cliente</button>
        </form></section>
        <section className="panel"><h2>Clientes cadastrados</h2><div className="list">{clients.map(c=><div className="list-row" key={c.id}><div><strong>{c.name}</strong><span>{c.document}</span></div><span>{c.whatsapp}</span></div>)}</div></section>
      </div>}

      {tab==='products' && <div className="two-cols">
        <section className="panel"><h2>Novo produto</h2><form className="form-grid" onSubmit={createProduct}><label className="full">Nome do produto<input name="name" required/></label><label className="full">Valor<input name="price" required placeholder="0,00"/></label><button className="primary full">Cadastrar produto</button></form></section>
        <section className="panel"><h2>Catálogo</h2><div className="list">{products.map(p=><div className="list-row" key={p.id}><strong>{p.name}</strong><strong>{money(p.price)}</strong></div>)}</div></section>
      </div>}

      {tab==='sales' && <div className="sale-layout">
        <section className="panel"><h2>1. Cliente e produtos</h2><label>Cliente<select value={selectedClient} onChange={e=>setSelectedClient(e.target.value)}><option value="">Selecione...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name} — {c.document}</option>)}</select></label>
          <div className="product-grid">{products.map(p=><button key={p.id} className="product-card" onClick={()=>addProduct(p.id)}><span>{p.name}</span><strong>{money(p.price)}</strong></button>)}</div>
          <h3>Itens da venda</h3><div className="list">{items.map((i,idx)=>{const p=products.find(x=>x.id===i.productId);return <div className="list-row" key={i.productId}><span>{p?.name}</span><input className="qty" type="number" min="1" value={i.qty} onChange={e=>setItems(items.map((x,j)=>j===idx?{...x,qty:Number(e.target.value)}:x))}/><strong>{money((p?.price||0)*i.qty)}</strong></div>})}</div>
          <div className="sale-total">Total <strong>{money(saleTotal)}</strong></div>
        </section>
        <section className="panel"><h2>2. Prazo e assinatura</h2><div className="term-options"><button className={termDays===7?'selected':''} onClick={()=>setTermDays(7)}>7 dias</button><button className={termDays===15?'selected':''} onClick={()=>setTermDays(15)}>15 dias</button></div>
          <p>O cliente assina abaixo usando o dedo ou o mouse.</p><SignaturePad onChange={setSignature}/>
          <button className="primary full" onClick={finalizeSale}>Finalizar venda e gerar promissória</button>
        </section>
      </div>}

      {lastSale && tab==='sales' && <section className="panel success-box"><CheckCircle2/><div><h2>Venda concluída</h2><p>{lastSale.client.name} • {money(lastSale.total)} • vencimento em {new Date(lastSale.dueAt).toLocaleDateString('pt-BR')}</p></div><button className="whatsapp" onClick={()=>shareWhatsApp(lastSale)}><MessageCircle size={18}/> Compartilhar no WhatsApp</button></section>}

      {tab==='promissory' && <section className="panel"><h2>Promissórias e pagamentos</h2><SalesTable sales={sales.slice().reverse()} onShare={shareWhatsApp} onPay={markPaid}/></section>}
    </main>
  </div>;
}

function SalesTable({ sales, onShare, onPay }) {
  if (!sales.length) return <p className="muted">Nenhuma venda registrada.</p>;
  return <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td>{s.client.name}</td><td>{new Date(s.dueAt).toLocaleDateString('pt-BR')}</td><td>{money(s.total)}</td><td><span className={`status ${s.status.toLowerCase()}`}>{s.status}</span></td><td className="actions"><button onClick={()=>onShare(s)}>WhatsApp</button>{s.status==='PENDENTE'&&<button onClick={()=>onPay(s)}>Simular pagamento</button>}<details><summary>Pix</summary><div className="pix-box"><QRCodeSVG value={s.payment.pixCopyPaste} size={150}/><code>{s.payment.pixCopyPaste}</code></div></details></td></tr>)}</tbody></table></div>;
}
