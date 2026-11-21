import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, handler, parseBody, requireAdmin } from '@/lib/api'
import { createProductionSchema } from '@/lib/validation'

export const GET = handler(async () => {
  await requireAdmin()
  const entries = await prisma.productionEntry.findMany({
    include: { worker: { select: { name: true } } },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  })
  return NextResponse.json(entries)
})

/**
 * Regista produção: adiciona os blocos bons ao stock, desconta cimento e areia
 * do stock de materiais e grava o movimento, tudo numa transacção.
 */
export const POST = handler(async (req: Request) => {
  await requireAdmin()
  const data = await parseBody(req, createProductionSchema)

  const entry = await prisma.$transaction(
    async (tx) => {
      const product = await tx.product.findUnique({ where: { type: data.blockType } })
      if (!product) throw new ApiError(400, `Não existe stock configurado para o bloco "${data.blockType}".`)

      const good = data.quantity - data.damaged
      const created = await tx.productionEntry.create({ data })

      await tx.product.update({
        where: { id: product.id },
        data: { available: { increment: good }, total: { increment: good } },
      })
      if (good > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            productionId: created.id,
            type: 'producao',
            quantity: good,
            note: data.damaged ? `${data.damaged} danificados descartados` : null,
          },
        })
      }

      const consume = [
        { match: 'Cimento', amount: data.cementBags },
        { match: 'Areia', amount: data.sandM3 },
      ]
      for (const { match, amount } of consume) {
        if (amount <= 0) continue
        const material = await tx.materialStock.findFirst({
          where: { name: { contains: match, mode: 'insensitive' } },
        })
        if (material) {
          await tx.materialStock.update({
            where: { id: material.id },
            data: { current: { decrement: amount } },
          })
        }
      }

      return created
    },
    { timeout: 15_000, maxWait: 10_000 },
  )

  return NextResponse.json(entry, { status: 201 })
})
