# BlokManager

Sistema de gestão e venda de blocos de cimento (Nampula, Moçambique).

- **Loja pública** — catálogo (`/`), checkout (`/checkout`), página privada do pedido com pagamento (`/pedido/[token]`), acompanhamento (`/acompanhar`).
- **Administração** (protegida por login) — `/dashboard`, `/encomendas`, `/producao`, `/produtos`, `/trabalhadores`, `/configuracoes`.

## Fluxo de venda

1. Cliente escolhe os blocos e faz o pedido → os blocos ficam **reservados** no stock.
2. Cliente paga por M-Pesa / e-Mola e indica a referência na página do pedido → pagamento **em verificação**.
3. Admin confirma o pagamento → encomenda **confirmada** automaticamente (ou confirma manualmente se o pagamento for na entrega).
4. Admin agenda motorista/data, marca **em entrega** e depois **entregue** → os blocos saem do armazém.
5. Cancelar em qualquer fase antes da entrega devolve a reserva ao stock disponível.

Toda a lógica de stock e pagamentos está em `src/lib/orders.ts` (transacções).

O plano de evolução e o estado de cada tarefa estão em [`progress.md`](./progress.md).

## Stack

- Next.js 16 (App Router; `src/proxy.ts` substitui o antigo `middleware.ts`)
- React 19, Tailwind CSS 4, componentes shadcn/ui
- Prisma 5 + PostgreSQL (Neon)
- NextAuth v5 (Credentials — um administrador definido por variáveis de ambiente)
- zod para validação das APIs

## Configuração

1. Instalar dependências:

   ```bash
   npm install
   ```

2. Criar o ficheiro `.env` na raiz:

   ```env
   DATABASE_URL="postgresql://utilizador:senha@host/base?sslmode=require"
   NEXTAUTH_SECRET="uma-string-aleatoria-longa"   # ex.: npx auth secret
   NEXTAUTH_URL="http://localhost:3000"
   ADMIN_EMAIL="admin@exemplo.com"
   ADMIN_PASSWORD="palavra-passe-forte"
   ```

3. Criar as tabelas e (opcionalmente) dados de exemplo:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed     # idempotente: pode correr várias vezes
   ```

4. Arrancar em desenvolvimento:

   ```bash
   npm run dev
   ```

   Loja em <http://localhost:3000>, administração em <http://localhost:3000/login>.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `prisma generate` + build de produção |
| `npm start` | Servir o build de produção |
| `npm run lint` | ESLint |

## Estrutura

```
auth.ts                 Configuração NextAuth
prisma/                 Schema, migrações e seed
src/proxy.ts            Redirecciona páginas de admin para /login sem sessão
src/app/(storefront)/   Loja: início, checkout, pedido, acompanhar, termos
src/app/(admin)/        Páginas de administração
src/app/api/            Route handlers. Públicos: checkout, pedido/[token]/pagamento,
                        acompanhar. Todos os outros exigem sessão de admin.
src/lib/orders.ts       Regras de negócio: criar encomenda, reservar/libertar stock,
                        mudar estado, pagamentos
src/lib/catalog.ts      Produtos e zonas visíveis na loja
src/lib/settings.ts     Configurações editáveis (números de pagamento, WhatsApp)
src/lib/format.ts       Formatação (MT, datas, telefones), rótulos e transições de estado
src/lib/api.ts          requireAdmin(), parseBody() e tratamento de erros das APIs
src/lib/validation.ts   Schemas zod
src/lib/fetcher.ts      apiFetch() para o lado do cliente
src/lib/cart-context.tsx Carrinho (localStorage + useSyncExternalStore)
src/components/store/   Componentes da loja
src/components/ui/      Componentes base (field, modal, button, …)
```

## Deploy (Vercel)

Definir as mesmas variáveis de ambiente no projecto Vercel e correr `npx prisma migrate deploy` contra a base de produção sempre que houver novas migrações.

Ao publicar uma versão com migração nova: fazer backup (branch) no Neon, aplicar a migração e fazer o push logo a seguir, para o código e o schema não ficarem desalinhados.
