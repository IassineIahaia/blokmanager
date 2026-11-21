import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, requireAdmin } from '@/lib/api'

export const GET = handler(async () => {
  await requireAdmin()
  const [blockStocks, materialStocks] = await Promise.all([
    prisma.blockStock.findMany(),
    prisma.materialStock.findMany(),
  ])
  return NextResponse.json({ blockStocks, materialStocks })
})
