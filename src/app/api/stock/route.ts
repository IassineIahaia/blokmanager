import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, requireAdmin } from '@/lib/api'

export const GET = handler(async () => {
  await requireAdmin()
  const [blockStocks, materialStocks] = await Promise.all([
    prisma.product.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] }),
    prisma.materialStock.findMany({ orderBy: { name: 'asc' } }),
  ])
  return NextResponse.json({ blockStocks, materialStocks })
})
