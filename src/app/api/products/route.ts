import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, requireAdmin } from '@/lib/api'

export const GET = handler(async () => {
  await requireAdmin()
  const products = await prisma.product.findMany({ orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }] })
  return NextResponse.json(products)
})
