const pdfService = require('../services/pdfService');
const whatsappService = require('../services/whatsappService');

exports.finalizarVenda = async (req, res) => {
    try {
        const { cliente, pedido, assinaturaBase64 } = req.body;

        // 1. Salva no banco de dados (por enquanto, em memória)
        const novaVenda = {
            id: Date.now(),
            cliente,
            pedido,
            status: 'Pendente',
            dataCompra: new Date(),
        };
        global.db.vendas.push(novaVenda);

        // 2. Gera a Promissória em PDF usando a assinatura
        const pdfBuffer = await pdfService.gerarPromissoria(novaVenda, assinaturaBase64);

        // 3. Dispara o WhatsApp (Simulação por enquanto)
        await whatsappService.enviarComprovante(cliente.whatsapp, pdfBuffer);

        res.status(200).json({ 
            sucesso: true, 
            mensagem: 'Venda finalizada! PDF gerado e enviado no WhatsApp.',
            idVenda: novaVenda.id 
        });

    } catch (erro) {
        console.error("Erro ao finalizar venda:", erro);
        res.status(500).json({ sucesso: false, erro: 'Erro interno no servidor' });
    }
};

exports.obterDashboard = (req, res) => {
    res.json({
        totalVendas: global.db.vendas.length,
        vendas: global.db.vendas
    });
};
