const express = require('express');
const router = express.Router();
const vendaController = require('./controllers/vendaController');

// Banco de dados em memória (Enquanto não plugamos o MongoDB)
global.db = {
    vendas: [],
    clientes: []
};

// Rota para processar a venda e a assinatura
router.post('/finalizar-venda', vendaController.finalizarVenda);

// Rota para o painel admin buscar os dados
router.get('/dashboard', vendaController.obterDashboard);

module.exports = router;
