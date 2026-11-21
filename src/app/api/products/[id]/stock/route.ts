import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { stockAdjustSchema } from '@/lib/validation'

/** Ajuste manual do stock disponível (quebras, contagem física). */
export const POST = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const { quantity, note } = await parseBody(req, stockAdjustSchema)

  const product = await prisma.$transaction(async (tx) => {
    const res = await tx.product.updateMany({
      where: { id, ...(quantity < 0 ? { available: { gte: -quantity } } : {}) },
      data: { available: { increment: quantity }, total: { increment: quantity } },
    })
    if (res.count === 0) {
      const exists = await tx.product.findUnique({ where: { id } })
      throw exists
        ? new ApiError(400, `Não pode retirar mais do que o disponível (${exists.available}).`)
        : new ApiError(404, 'Produto não encontrado.')
    }
    await tx.stockMovement.create({ data: { productId: id, type: 'ajuste', quantity, note } })
    return tx.product.findUniqueOrThrow({ where: { id } })
  })

  return NextResponse.json(product)
})
