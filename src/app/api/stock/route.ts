import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [blockStocks, materialStocks] = await Promise.all([
    prisma.blockStock.findMany(),
    prisma.materialStock.findMany(),
  ])
  return NextResponse.json({ blockStocks, materialStocks })
}