import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, handler, parseBody, requireAdmin } from '@/lib/api'
import { createProductionSchema } from '@/lib/validation'

export const GET = handler(async () => {
  await requireAdmin()
  const entries = await prisma.productionEntry.findMany({
    include: { worker: { select: { name: true } } },
    orderBy: { date: 'desc' },
    take: 50,
  })
  return NextResponse.json(entries)
})

export const POST = handler(async (req: Request) => {
  await requireAdmin()
  const data = await parseBody(req, createProductionSchema)

  const stock = await prisma.blockStock.findUnique({ where: { type: data.blockType } })
  if (!stock) {
    throw new ApiError(400, `Não existe stock configurado para o bloco "${data.blockType}".`)
  }

  // Cria o registo de produção e actualiza o stock atomicamente
  const [entry] = await prisma.$transaction([
    prisma.productionEntry.create({ data }),
    prisma.blockStock.update({
      where: { type: data.blockType },
      data: {
        available: { increment: data.quantity - data.damaged },
        total: { increment: data.quantity - data.damaged },
      },
    }),
  ])

  return NextResponse.json(entry, { status: 201 })
})
