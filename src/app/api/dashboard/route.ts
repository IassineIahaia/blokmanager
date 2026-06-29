import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [orders, blockStocks, materialStocks] = await Promise.all([
    prisma.order.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    }),
    prisma.blockStock.findMany(),
    prisma.materialStock.findMany(),
  ])

  const blocksInStock = blockStocks.reduce((sum, b) => sum + b.available, 0)
  const pendingOrders = orders.filter(o => o.status === 'pendente').length
  const dailyCash = orders
    .filter(o => o.status === 'confirmado' || o.status === 'entregue')
    .reduce((sum, o) => sum + o.valor, 0)

  const blocksByType = blockStocks.map(b => ({
    type: b.label.replace('Bloco de ', ''),
    quantity: b.available,
  }))

  return NextResponse.json({
    metrics: {
      blocksInStock,
      blocksByType,
      productionToday: 0,
      productionGoal: 1000,
      productionChangePct: 0,
      pendingOrders,
      dailyCash,
    },
    recentOrders: orders.slice(0, 5),
    materialStocks,
  })
}