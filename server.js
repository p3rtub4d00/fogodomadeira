const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
// Aumentamos o limite do JSON por causa da imagem base64 da assinatura
app.use(express.json({ limit: '10mb' })); 
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api', routes);

// Redirecionamentos do Frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'venda.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`👉 Acesse a área de vendas: http://localhost:${PORT}/`);
    console.log(`👉 Acesse o painel ADM: http://localhost:${PORT}/admin`);
});
