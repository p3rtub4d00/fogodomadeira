# Fogo do Madeira — Gestão de Vendas a Prazo

Primeira versão funcional para validar o fluxo antes de integrar MongoDB e Mercado Pago.

## O que já funciona

- Cadastro de clientes com nome/razão social, CPF/CNPJ, telefone, WhatsApp e endereço.
- Cadastro de produtos e valores.
- Nova venda com seleção de cliente e produtos.
- Cálculo automático do total.
- Prazo de 7 ou 15 dias.
- Assinatura digital na tela usando mouse ou toque.
- Criação de promissória em modo de teste.
- QR Code Pix simulado com o valor da venda.
- Botão para compartilhar a cobrança pelo WhatsApp.
- Simulação de pagamento.
- Dashboard com vendas, valores em aberto e recebidos.
- Endpoint de lembretes para vencimentos de hoje e amanhã.

> Importante: nesta fase os dados ficam apenas na memória do servidor. Ao reiniciar o backend, os cadastros e vendas são apagados. Isso é proposital. O MongoDB será integrado depois da validação do sistema.

## Rodar no computador

Na raiz do projeto:

```bash
npm install
npm run install:all
npm run dev
```

Depois abra:

```text
http://localhost:5173
```

O backend roda em:

```text
http://localhost:3001
```

## Estrutura

```text
fogodomadeira/
├─ client/        # React + Vite
│  └─ src/
│     ├─ App.jsx
│     └─ styles.css
├─ server/        # Node.js + Express
│  └─ server.js
├─ package.json
└─ README.md
```

## Próximas etapas planejadas

1. Gerar a promissória em PDF com dados completos da venda e assinatura.
2. Compartilhar/baixar a promissória pelo celular.
3. Tela de detalhes do cliente e histórico de compras.
4. Lembretes automáticos de cobrança.
5. Integração real com Mercado Pago.
6. Integração com MongoDB.
7. Preparação final para Render.

## Modo de pagamento atual

O sistema gera somente um código Pix de simulação. Nenhuma cobrança real é criada e nenhum dinheiro é movimentado nesta versão.
