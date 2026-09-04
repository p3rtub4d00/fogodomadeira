import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

let clients = [];
let products = [
  { id: 'p1', name: 'Produto Exemplo 1', price: 50 },
  { id: 'p2', name: 'Produto Exemplo 2', price: 85 }
];
let sales = [];

const id = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};
const onlyDate = (value) => new Date(value).toISOString().slice(0, 10);

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'simulation' }));

app.get('/api/clients', (_req, res) => res.json(clients));
app.post('/api/clients', (req, res) => {
  const { name, document, phone, whatsapp, street, number, neighborhood, city, state, zipCode } = req.body;
  if (!name || !document || !whatsapp) {
    return res.status(400).json({ message: 'Nome, CPF/CNPJ e WhatsApp são obrigatórios.' });
  }
  const client = {
    id: id('cli'), name, document, phone: phone || '', whatsapp,
    address: { street: street || '', number: number || '', neighborhood: neighborhood || '', city: city || '', state: state || '', zipCode: zipCode || '' },
    createdAt: new Date().toISOString()
  };
  clients.push(client);
  res.status(201).json(client);
});

app.get('/api/products', (_req, res) => res.json(products));
app.post('/api/products', (req, res) => {
  const name = String(req.body.name || '').trim();
  const price = Number(req.body.price);
  if (!name || !Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ message: 'Informe nome e valor válido.' });
  }
  const product = { id: id('prd'), name, price };
  products.push(product);
  res.status(201).json(product);
});

app.get('/api/sales', (_req, res) => res.json(sales));
app.post('/api/sales', (req, res) => {
  const { clientId, items, termDays, signatureDataUrl } = req.body;
  const client = clients.find((c) => c.id === clientId);
  if (!client) return res.status(400).json({ message: 'Cliente inválido.' });
  if (![7, 15].includes(Number(termDays))) return res.status(400).json({ message: 'Prazo deve ser 7 ou 15 dias.' });
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ message: 'Adicione ao menos um produto.' });
  if (!signatureDataUrl) return res.status(400).json({ message: 'A assinatura do cliente é obrigatória.' });

  const normalizedItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const qty = Math.max(1, Number(item.qty || 1));
    if (!product) throw new Error('Produto inválido.');
    return { productId: product.id, name: product.name, unitPrice: product.price, qty, subtotal: product.price * qty };
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const createdAt = new Date().toISOString();
  const dueAt = addDays(createdAt, Number(termDays));
  const saleId = id('sale');
  const pixCopyPaste = `PIX-SIMULACAO|VENDA=${saleId}|VALOR=${total.toFixed(2)}|VENC=${onlyDate(dueAt)}`;

  const sale = {
    id: saleId,
    client,
    items: normalizedItems,
    total,
    termDays: Number(termDays),
    createdAt,
    dueAt,
    signatureDataUrl,
    status: 'PENDENTE',
    payment: { provider: 'SIMULACAO', pixCopyPaste, paidAt: null }
  };
  sales.push(sale);
  res.status(201).json(sale);
});

app.post('/api/sales/:id/pay-simulation', (req, res) => {
  const sale = sales.find((s) => s.id === req.params.id);
  if (!sale) return res.status(404).json({ message: 'Venda não encontrada.' });
  sale.status = 'PAGO';
  sale.payment.paidAt = new Date().toISOString();
  res.json(sale);
});

app.get('/api/reminders', (_req, res) => {
  const now = new Date();
  const today = onlyDate(now);
  const tomorrow = onlyDate(addDays(now, 1));
  const pending = sales.filter((s) => s.status === 'PENDENTE');
  res.json({
    today: pending.filter((s) => onlyDate(s.dueAt) === today),
    tomorrow: pending.filter((s) => onlyDate(s.dueAt) === tomorrow)
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (err) => err && next());
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(400).json({ message: err.message || 'Erro interno.' });
});

app.listen(PORT, () => console.log(`Fogo do Madeira rodando na porta ${PORT}`));
