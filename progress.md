# BlokManager — Plano de Melhoria

> Objectivo: ligar todo o sistema de ponta a ponta — **loja → pedido → pagamento → confirmação → entrega** — com a administração (stock, produção, trabalhadores) sincronizada, e melhorar o design.
>
> Legenda: `[ ]` por fazer · `[x]` feito · `[~]` em curso

---

## ⚠️ Pendente antes de publicar (precisa de ti)

O código novo **e** a base de dados têm de ser actualizados juntos (o código novo não funciona com o schema antigo e vice-versa). Nada foi aplicado ao Neon nem à Vercel.

1. No painel do Neon, criar um **branch/backup** da base de produção (segurança).
2. Aplicar a migração ao Neon (preserva as encomendas existentes):
   ```bash
   npx prisma migrate deploy        # com o DATABASE_URL de produção no .env
   ```
3. Juntar o branch `fase-1-base-tecnica` ao `main` e fazer push (a Vercel publica sozinha).
4. Entrar em `/configuracoes` e confirmar os números M-Pesa / e-Mola / WhatsApp (vieram do checkout antigo).
5. Fazer uma encomenda de teste real na loja e segui-la no admin.

> Os passos 2 e 3 devem ser feitos seguidos (minutos de diferença), porque entre um e outro o site fica com código e base desalinhados.

---

## 0. Diagnóstico inicial (21/11/2026)

**Stack:** Next.js 16.2.9 (App Router, `proxy.ts`), React 19, Prisma 5 + PostgreSQL (Neon), NextAuth v5 beta, Tailwind 4 + shadcn, zod.

Problemas encontrados e estado:
1. ✅ Checkout não gravava nada na BD — agora cria a encomenda, reserva stock e gera código `BM-0001`.
2. ✅ Catálogo vinha de `mock-data.ts` — agora vem da BD (preços, mínimos, stock real).
3. ✅ Modelo `Order` pobre — agora tem itens, cliente, entrega, pagamentos, histórico.
4. ✅ Stock não reagia às encomendas — reserva, libertação e saída automáticas.
5. ✅ Produção não abatia materiais — agora desconta cimento e areia.
6. ✅ APIs sem protecção — `requireAdmin()` em todas as APIs de admin.
7. ✅ Admin sem navegação em mobile — menu inferior.
8. ✅ Nome fixo no header / sem logout — utilizador da sessão + terminar sessão.
9. ✅ Botões sem acção — todos ligados.
10. ✅ Dashboard com dados falsos — métricas reais e gráficos de 7 dias.
11. ✅ Maputo vs Nampula — corrigido.
12. ✅ Carrinho inconsistente — mínimo e incremento por produto, validação de stock.
13. ✅ Limpeza técnica — dependências, ficheiros mortos, tipos, validação, erros.
14. ✅ `middleware.ts` → `proxy.ts` commitado.
15. ✅ (descoberto) Tokens de cor/texto em falta no tema (`text-on-primary`, `text-on-surface`, `text-error`…): botões verdes não tinham texto branco.

---

## Fase 1 — Base técnica e segurança ✅
- [x] Migração `middleware.ts` → `proxy.ts` commitada
- [x] `requireAdmin()` em todos os route handlers de admin (testado: 401 sem sessão)
- [x] Removida a rota `/api/dashboard` (não usada, expunha dados)
- [x] Removidas dependências e ficheiros mortos (libsql, `dev.db`, `prisma.config.ts`, `src/generated/`)
- [x] Validação `zod` em todas as APIs (`src/lib/validation.ts`), erros em PT (`src/lib/api.ts`), `apiFetch` no cliente
- [x] Seed idempotente; README actualizado

## Fase 2 — Modelo de dados ✅
- [x] `Product` (tabela `BlockStock`): preço, mínimo, incremento, activo, imagem, ordem
- [x] `DeliveryZone`, `Customer`, `OrderItem`, `Payment`, `OrderEvent`, `StockMovement`, `Setting`
- [x] `Order` reformulado: número sequencial (`BM-0001`), token privado, entrega, subtotal/taxa/total, estado + estado de pagamento, motorista, datas
- [x] Enums Prisma para estados; dinheiro em `Int` (meticais)
- [x] Migração `20261121090000_vendas_pagamentos_stock` escrita à mão para **preservar** as encomendas existentes (renomeia colunas, converte tipos, preenche números/tokens) e carregar preços, zonas e configurações
- [x] Testada numa cópia local do estado de produção: dados preservados, schema sem drift

## Fase 3 — Loja ligada à BD ✅
- [x] Página inicial (Server Component) lê produtos, preços, stock e zonas da BD
- [x] Cartões de produto com estado de stock (disponível / últimas unidades / esgotado) e ilustração por tipo
- [x] Carrinho reescrito (`useSyncExternalStore`): sem salto na hidratação, sincroniza preços com o catálogo
- [x] Gaveta do carrinho no cabeçalho; menu mobile
- [x] `mock-data.ts` e `src/types` removidos

## Fase 4 — Checkout ✅
- [x] 3 passos: rever carrinho → dados e entrega → método de pagamento
- [x] Validação no cliente (telefone moçambicano, endereço, stock, mínimos) e de novo no servidor
- [x] `POST /api/checkout`: recalcula preços e taxa no servidor, reserva stock de forma atómica, cria cliente + encomenda + itens + histórico numa transacção
- [x] Protecção contra abuso: máx. 3 encomendas por pagar por telefone
- [x] Redireciona para a página privada do pedido

## Fase 5 — Pagamento ✅ (etapa A, manual)
- [x] Página do pedido mostra o número M-Pesa/e-Mola (ou dados bancários) com botão copiar e o código do pedido como descritivo
- [x] Cliente submete a referência da transacção → pagamento "em verificação"
- [x] Admin confirma/rejeita; ao ficar totalmente pago a encomenda confirma-se sozinha
- [x] Admin pode registar pagamentos (numerário, parciais)
- [x] Números de pagamento em `/configuracoes` (tabela `Setting`), não no código
- [ ] **Etapa B (futuro):** integração automática M-Pesa / e-Mola com webhook — depende de contas de API

## Fase 6 — Confirmação, entrega e acompanhamento ✅
- [x] Estados `pendente → confirmado → em_entrega → entregue` (+ `cancelado`), com transições validadas
- [x] Entregue: blocos saem do armazém; cancelado: reserva volta ao disponível (com movimentos de stock)
- [x] Motorista (trabalhadores com função Motorista) e data prevista de entrega
- [x] Página pública "Acompanhar pedido" (código + telefone)
- [x] Botão "Avisar cliente" no admin: abre WhatsApp com mensagem pronta para o estado actual
- [x] Recibo imprimível / PDF (página do pedido e detalhe no admin)

## Fase 7 — Administração ✅
- [x] Encomendas: separadores por estado, filtro de pagamento, pesquisa (nome, telefone, código), paginação, vista mobile em cartões
- [x] Detalhe da encomenda: itens, cliente, pagamentos, entrega, histórico, acções com confirmação
- [x] Encomenda manual com produtos reais (reserva stock)
- [x] Produtos: editar preço/mínimo/incremento/descrição/foto, activar/desactivar, ajuste manual de stock, histórico de movimentos
- [x] Zonas de entrega: criar, editar, desactivar, apagar
- [x] Produção: abate materiais, entrada de materiais, histórico de produção
- [x] Equipa: criar/editar trabalhador, marcar presenças (clique no dia), empréstimos e reembolsos, resumo salarial
- [x] Painel: acções pendentes, produção hoje vs ontem, recebido hoje, gráficos de 7 dias, alertas de stock de blocos e materiais

## Fase 8 — Design e UX ✅
- [x] Tokens de cor/tipografia em falta adicionados ao tema
- [x] Loja: hero novo, garantias, catálogo, "como encomendar", entregas com taxas, FAQ, rodapé com WhatsApp e telefone reais
- [x] Componentes reutilizáveis: `Field`/`TextInput`/`SelectInput`/`TextArea`/`Alert`, `Modal`
- [x] Admin: sidebar com utilizador + logout, menu inferior em mobile, cabeçalhos com acções
- [x] Páginas de Termos e Privacidade; metadata/SEO (Nampula, Open Graph); páginas privadas com `noindex`
- [x] `confirm()` do browser substituído por diálogos próprios
- [ ] Fotos reais dos produtos (basta colar o URL em Produtos → Editar)
- [ ] Testar em telemóveis reais

## Fase 9 — Qualidade e deploy
- [x] `tsc --noEmit` e `eslint` sem erros nem avisos
- [x] `npm run build` de produção passa
- [x] Teste de ponta a ponta (78 verificações) contra BD local: loja, checkout, validações, stock, acompanhamento, pagamento, confirmação, entrega, cancelamento, limites, encomenda manual, produção, produtos, zonas, configurações, equipa
- [x] Verificação visual no browser (loja, carrinho, checkout, pedido, login, encomendas, detalhe, painel)
- [ ] **Aplicar migração no Neon + publicar na Vercel** (ver topo)
- [ ] Export CSV das encomendas (opcional)

---

## Ideias para depois
- Integração automática M-Pesa / e-Mola (webhook confirma o pagamento sozinho)
- Notificações automáticas por SMS/WhatsApp API
- Vários utilizadores admin com permissões (gerente, vendedor, motorista)
- Expirar automaticamente encomendas não pagas após X dias (liberta stock)
- Relatórios mensais (vendas por produto, por zona, produtividade por trabalhador)
