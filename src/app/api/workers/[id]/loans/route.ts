import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { loanSchema } from '@/lib/validation'

/**
 * Empréstimo/adiantamento (soma à dívida) ou reembolso (abate à dívida).
 * Os reembolsos ficam no histórico com valor negativo.
 */
export const POST = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const { kind, amount, description } = await parseBody(req, loanSchema)

  const loan = await prisma.$transaction(async (tx) => {
    const worker = await tx.worker.findUnique({ where: { id } })
    if (!worker) throw new ApiError(404, 'Trabalhador não encontrado.')
    if (kind === 'reembolso' && amount > worker.debt) {
      throw new ApiError(400, `O reembolso não pode ser maior que a dívida (${worker.debt} MT).`)
    }
    const signed = kind === 'reembolso' ? -amount : amount
    const created = await tx.loan.create({
      data: { workerId: id, amount: signed, description: description ?? (kind === 'reembolso' ? 'Reembolso' : null) },
    })
    await tx.worker.update({ where: { id }, data: { debt: { increment: signed } } })
    return created
  })

  return NextResponse.json(loan, { status: 201 })
})
