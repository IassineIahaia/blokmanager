# BlokManager

Sistema de gestão e venda de blocos de cimento (Nampula, Moçambique).

- **Loja pública** (`/`, `/checkout`) — catálogo, carrinho e pedido.
- **Administração** (`/dashboard`, `/encomendas`, `/producao`, `/trabalhadores`) — protegida por login.

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
src/app/(storefront)/   Checkout da loja
src/app/(admin)/        Páginas de administração
src/app/api/            Route handlers (todos exigem sessão de admin)
src/lib/api.ts          requireAdmin(), parseBody() e tratamento de erros das APIs
src/lib/validation.ts   Schemas zod
src/lib/fetcher.ts      apiFetch() para o lado do cliente
```

## Deploy (Vercel)

Definir as mesmas variáveis de ambiente no projecto Vercel e correr `npx prisma migrate deploy` contra a base de produção sempre que houver novas migrações.
