const PDFDocument = require('pdfkit');

exports.gerarPromissoria = (dadosVenda, assinaturaBase64) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            let buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Cabeçalho
            doc.fontSize(20).text('NOTA PROMISSÓRIA DIGITAL', { align: 'center' });
            doc.moveDown();

            // Corpo do texto jurídico
            doc.fontSize(12).text(`Eu, ${dadosVenda.cliente.nome}, inscrito(a) no CPF/CNPJ ${dadosVenda.cliente.documento}, residente no endereço ${dadosVenda.cliente.endereco}, reconheço a dívida referente à compra de mercadorias totalizando R$ ${dadosVenda.pedido.valorTotal}, com vencimento programado para ${dadosVenda.pedido.prazo} dias.`);
            doc.moveDown(2);

            // Resumo do Pedido
            doc.text(`Itens Adquiridos: ${dadosVenda.pedido.produtos}`);
            doc.moveDown(4);

            // Processa a assinatura em Base64 para Imagem no PDF
            if (assinaturaBase64) {
                const imagemBuffer = Buffer.from(assinaturaBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
                doc.image(imagemBuffer, doc.page.width / 2 - 100, doc.y, { width: 200 });
                doc.moveDown(1);
            }

            // Linha de assinatura e data
            doc.text('____________________________________________________', { align: 'center' });
            doc.text('Assinatura do Cliente', { align: 'center' });
            doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};
