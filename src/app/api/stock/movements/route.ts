import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, requireAdmin } from '@/lib/api'

/** Histórico dos últimos movimentos de stock de blocos. */
export const GET = handler(async () => {
  await requireAdmin()
  const movements = await prisma.stockMovement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      product: { select: { label: true } },
      order: { select: { id: true, number: true } },
    },
  })
  return NextResponse.json(movements)
})
