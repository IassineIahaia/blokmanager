# BlokManager — Plano de Melhoria

> Objectivo: ligar todo o sistema de ponta a ponta — **loja → pedido → pagamento → confirmação → entrega** — com a administração (stock, produção, trabalhadores) sincronizada, e melhorar o design.
>
> Legenda: `[ ]` por fazer · `[x]` feito · `[~]` em curso

---

## 0. Diagnóstico (estado actual, lido em 21/11/2026)

**Stack:** Next.js 16.2.9 (App Router, `proxy.ts` em vez de `middleware.ts`), React 19, Prisma 5 + PostgreSQL (Neon), NextAuth v5 beta (Credentials, 1 admin via env), Tailwind 4 + shadcn.

**O que já funciona**
- Login admin + protecção das páginas `/dashboard`, `/trabalhadores`, `/producao`, `/encomendas`
- Dashboard lê da BD (encomendas, stock de blocos, materiais)
- Produção: registo grava na BD e incrementa o stock de blocos
- Encomendas (admin): criar manualmente, mudar estado, eliminar
- Trabalhadores: listagem com presenças e empréstimos (só leitura)
- Loja: catálogo, carrinho (localStorage), checkout em 2 passos que abre o WhatsApp

**Problemas encontrados (o sistema está desligado em vários pontos)**
1. **O checkout não grava nada na BD** — só abre o WhatsApp. O admin nunca vê o pedido em `/encomendas`. O ID `BM-xxxx` é aleatório e pode repetir.
2. **O catálogo da loja vem de `mock-data.ts`**, não da BD. Preços e disponibilidade não ligam ao stock real. O tipo `"Pavê"` na loja ≠ `"pave"` na BD.
3. **O modelo `Order` é pobre**: só `cliente`, `valor`, `status`. Faltam itens, telefone, endereço, zona, taxa de entrega, método/estado de pagamento, referência da transacção.
4. **Stock não reage às encomendas**: `reserved` nunca muda; entrega não abate stock.
5. **Produção não abate materiais** (cimento/areia) apesar de registar o consumo.
6. **APIs sem protecção**: o `proxy.ts` não cobre `/api/*` — qualquer pessoa pode `DELETE /api/orders/:id` ou `POST /api/workers`.
7. **Admin em mobile sem navegação**: `AdminBottomNav` existe mas não é usado no layout.
8. **Nome do utilizador fixo no header** ("João Silva" / "Issufo Pereira"); não há botão de logout.
9. **Botões sem acção**: "Ver todas", "Solicitar Suprimentos", "Ver Histórico de Entradas", "Novo Registo", "Registar Empréstimo", "Área do Cliente", "WhatsApp Suporte", links de Termos/Privacidade.
10. **Dashboard com dados falsos/errados**: "Produção Hoje" fixo a 0, "Caixa do Dia" soma tudo (não só hoje), percentagem fixa.
11. **Inconsistências de localização**: mapa do checkout aponta para Maputo, negócio é em Nampula; metadata diz "Maputo".
12. **Carrinho inconsistente**: no cartão do produto o passo é o `minimumOrder`, no carrinho flutuante é 50; mínimo de encomenda não é validado.
13. **Limpeza técnica**: dependências não usadas (`@libsql/client`, `@prisma/adapter-libsql`), `prisma/prisma/dev.db` esquecido, `prisma.config.ts` vazio, seed não idempotente, dinheiro em `Float`, estados como `String` livre, `mock-data.ts` ainda importado, sem validação de input, `fetch` sem tratamento de erro.
14. Alteração por commitar: `src/middleware.ts` → `src/proxy.ts` + `src/app/api/auth/`.

---

## Fase 1 — Base técnica e segurança ✅ (21/11/2026, branch `fase-1-base-tecnica`)
- [x] Commitar a migração `middleware.ts` → `proxy.ts` (já feita localmente)
- [x] Proteger as APIs de admin — `requireAdmin()` em todos os route handlers (testado: 401 sem sessão)
- [x] Remover a rota `/api/dashboard` (não era usada e expunha dados)
- [x] Remover dependências não usadas (`@libsql/client`, `@prisma/adapter-libsql`), `prisma/prisma/dev.db`, `prisma.config.ts` vazio e cliente antigo em `src/generated/`
- [x] Adicionar validação de input com `zod` em todas as APIs (`src/lib/validation.ts`)
- [x] Criar helper de respostas/erros para as APIs, mensagens em PT (`src/lib/api.ts`) e `apiFetch` no cliente (`src/lib/fetcher.ts`)
- [x] Ecrãs de admin (encomendas, produção, trabalhadores) mostram erros em vez de rebentar
- [x] Produção: valida que o tipo de bloco existe e que danificados ≤ produzidos; `total` passa a contar só blocos bons (antes somava os danificados)
- [x] Token de cor `error` adicionado ao tema (`text-error` não tinha efeito)
- [x] Tornar o seed idempotente (`upsert` / verificação antes de criar)
- [x] Actualizar `README.md`
- [ ] → Fase 2: mover produtos e zonas da loja para o seed (depende dos novos modelos)

> Pendentes de lint já existentes, tratados nas fases seguintes: `setState` em effect no `cart-context.tsx` (Fase 3), `AdminBottomNav` não usado (Fase 8), import `StatusBadge` não usado em encomendas.

## Fase 2 — Modelo de dados (Prisma)
- [ ] `Product` (ou estender `BlockStock`): nome público, descrição, preço unitário, encomenda mínima, imagem, activo/inactivo
- [ ] `DeliveryZone`: nome, taxa, activo
- [ ] `Customer`: nome, telefone (único), email opcional
- [ ] `Order` reformulado: código legível sequencial (`BM-0001`), cliente, zona, endereço, referência, instruções, subtotal, taxa de entrega, total, estado, datas (criado/confirmado/entregue)
- [ ] `OrderItem`: produto, quantidade, preço no momento da compra
- [ ] `Payment`: método (M-Pesa / e-Mola / transferência / numerário), valor, referência da transacção, comprovativo, estado (pendente / confirmado / rejeitado), confirmado por / quando
- [ ] `StockMovement`: histórico de entradas/saídas (produção, reserva, entrega, cancelamento, ajuste, compra de material)
- [ ] Usar `enum` do Prisma para estados; dinheiro em `Int` (meticais) ou `Decimal`
- [ ] Criar migração e correr seed actualizado

## Fase 3 — Loja ligada à BD
- [ ] API pública `GET /api/products` (preço, mínimo, disponível = stock disponível > 0)
- [ ] Catálogo da página inicial lê da BD (Server Component + carrinho no cliente)
- [ ] Unificar identificação do produto (usar `id`/`type` da BD; acabar com "Pavê" vs "pave")
- [ ] Carrinho: passo e mínimo coerentes, validação de mínimo, aviso se quantidade > stock disponível
- [ ] API pública `GET /api/delivery-zones`
- [ ] Remover `src/lib/mock-data.ts` quando nada o usar

## Fase 4 — Fluxo de pedido (checkout)
- [ ] Passo 1: revisão do carrinho dentro do checkout (editar quantidades)
- [ ] Passo 2: dados do cliente (nome, telefone) + entrega (zona, endereço, referência); mapa centrado em Nampula
- [ ] Passo 3: método de pagamento
- [ ] `POST /api/checkout`: recalcula preços e taxa **no servidor**, valida stock, cria `Customer` + `Order` + `OrderItem` numa transacção, **reserva stock**
- [ ] Página de confirmação `/pedido/[codigo]` com resumo, instruções de pagamento e estado actual
- [ ] Botão WhatsApp continua disponível, mas com o código real do pedido já gravado

## Fase 5 — Pagamento
- [ ] **Etapa A (manual, já):** cliente paga por M-Pesa/e-Mola para o número do negócio e submete a referência da transacção (e opcionalmente foto do comprovativo) na página do pedido → `Payment` fica "pendente"
- [ ] Admin vê pagamentos pendentes, confirma ou rejeita → pedido passa a "pago/confirmado"
- [ ] Mover números M-Pesa/e-Mola de constantes no código para configuração (env ou tabela `Settings`)
- [ ] **Etapa B (opcional, depois):** integração automática (API M-Pesa Vodacom / agregador e-Mola) com webhook de confirmação — a decidir conforme contas disponíveis

## Fase 6 — Confirmação, entrega e acompanhamento
- [ ] Fluxo de estados: `pendente` → `pago` → `confirmado` → `em entrega` → `entregue` (+ `cancelado`)
- [ ] Ao **entregar**: abater `available`/`reserved`/`total` e registar `StockMovement`
- [ ] Ao **cancelar**: libertar reserva
- [ ] Atribuir motorista (trabalhador com função Motorista) e data de entrega
- [ ] Página pública "Acompanhar pedido" (código + telefone) — liga ao botão "Área do Cliente"
- [ ] Notificação ao cliente via link WhatsApp pré-preenchido gerado pelo admin em cada mudança de estado
- [ ] Recibo/factura simples imprimível (PDF ou página de impressão)

## Fase 7 — Administração
**Encomendas**
- [ ] Lista com filtros (estado, data, pesquisa por cliente/código) e paginação
- [ ] Página de detalhe da encomenda (itens, cliente, entrega, pagamentos, histórico de estados)
- [ ] Encomenda manual (balcão/telefone) usando produtos reais em vez de só "valor"
- [ ] Substituir `confirm()` por diálogo próprio

**Produtos e preços**
- [ ] Página `/produtos`: editar preço, mínimo, descrição, activar/desactivar
- [ ] Gestão de zonas de entrega e taxas

**Produção e stock**
- [ ] Registo de produção abate cimento e areia do `MaterialStock`
- [ ] Registar compra/entrada de materiais (actualiza `lastRestock`, fornecedor) — liga "Solicitar Suprimentos"
- [ ] Histórico de movimentos de stock — liga "Ver Histórico de Entradas"
- [ ] Histórico de produção (lista + filtro por data/trabalhador)
- [ ] Ajuste manual de stock (quebras, contagem)

**Trabalhadores**
- [ ] Criar/editar/desactivar trabalhador ("Novo Registo")
- [ ] Marcar presenças do dia
- [ ] Registar empréstimo/adiantamento (actualiza `debt`)
- [ ] Folha de salário mensal (salário − faltas − dívida)

**Dashboard**
- [ ] Métricas reais: produção de hoje vs ontem, caixa do dia (pagamentos confirmados hoje), encomendas por pagar/por entregar
- [ ] Gráfico de vendas e produção dos últimos 7/30 dias
- [ ] "Ver todas" → `/encomendas`; alertas de stock baixo de blocos (não só materiais)

## Fase 8 — Design e UX
- [ ] Layout admin: adicionar `AdminBottomNav` em mobile, header com utilizador real da sessão + logout
- [ ] Componentes de formulário reutilizáveis (usar `ui/input`, `ui/select`, `ui/label` em vez de classes repetidas)
- [ ] Toasts de sucesso/erro e estados de loading consistentes (skeletons já existem)
- [ ] Loja: imagens reais dos produtos, hero com foto, secção de confiança (testemunhos, garantia), FAQ
- [ ] Ligar botões mortos: WhatsApp suporte (`wa.me`), telefone real, Termos e Privacidade (páginas simples)
- [ ] Corrigir textos: Maputo → Nampula na metadata, © ano dinâmico
- [ ] Revisão de acessibilidade (labels, contraste, foco, botões com `aria-label`)
- [ ] Testar responsividade em telemóvel (maioria dos clientes)
- [ ] SEO básico da loja (metadata, Open Graph, favicon próprio)

## Fase 9 — Qualidade e deploy
- [ ] `npm run lint` e `tsc --noEmit` sem erros
- [ ] Testar o fluxo completo: pedido na loja → aparece no admin → pagamento confirmado → entrega → stock actualizado
- [ ] Variáveis de ambiente na Vercel e migração em produção (`prisma migrate deploy`)
- [ ] Backup/export simples das encomendas (CSV)

---

## Ordem recomendada
Fase 1 → 2 → 3 → 4 → 5A → 6 → 7 → 8 → 9 (5B quando houver contas de API de pagamento).
A fase 8 (design) pode ir sendo feita em paralelo em cada ecrã que mexermos.

## Decisões em aberto
- Pagamento: começar manual (referência + confirmação do admin) ou já integrar API? → **Proposta: manual primeiro.**
- Cliente precisa de conta com login, ou basta acompanhar por código + telefone? → **Proposta: código + telefone.**
- Mais que um utilizador admin (ex.: gerente, vendedor) com permissões diferentes?
