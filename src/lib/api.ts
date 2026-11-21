import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { auth } from '@/../auth'

/** Erro com status HTTP, lançado dentro dos handlers e convertido em resposta JSON. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

/** Garante que existe uma sessão de administrador; caso contrário lança 401. */
export async function requireAdmin() {
  const session = await auth()
  if (!session?.user) {
    throw new ApiError(401, 'Não autorizado. Inicie sessão como administrador.')
  }
  return session
}

/** Lê o corpo JSON do pedido e valida-o com o schema zod indicado. */
export async function parseBody<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    throw new ApiError(400, 'Corpo do pedido inválido (JSON esperado).')
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ApiError(400, 'Dados inválidos.', z.flattenError(result.error).fieldErrors)
  }
  return result.data
}

/**
 * Envolve um route handler: converte ApiError, erros de validação e erros
 * conhecidos do Prisma em respostas JSON com mensagens em português.
 */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await fn(...args)
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, ...(err.details ? { details: err.details } : {}) },
          { status: err.status },
        )
      }

      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          return NextResponse.json({ error: 'Registo não encontrado.' }, { status: 404 })
        }
        if (err.code === 'P2002') {
          return NextResponse.json({ error: 'Já existe um registo com estes dados.' }, { status: 409 })
        }
        if (err.code === 'P2003') {
          return NextResponse.json({ error: 'Referência inválida a outro registo.' }, { status: 400 })
        }
      }

      console.error('[API]', err)
      return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
    }
  }
}

/** Contexto dos route handlers dinâmicos com `[id]`. */
export type IdContext = { params: Promise<{ id: string }> }
