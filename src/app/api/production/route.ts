import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const entries = await prisma.productionEntry.findMany({
    include: { worker: { select: { name: true } } },
    orderBy: { date: 'desc' },
    take: 50,
  })
  return NextResponse.json(entries)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { date, workerId, blockType, quantity, cementBags, sandM3, damaged } = body

  if (!date || !workerId || !blockType || !quantity) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
  }

  // Cria o registo de produção e actualiza o stock atomicamente
  const [entry] = await prisma.$transaction([
    prisma.productionEntry.create({
      data: {
        date: new Date(date),
        workerId,
        blockType,
        quantity: Number(quantity),
        cementBags: Number(cementBags) || 0,
        sandM3: Number(sandM3) || 0,
        damaged: Number(damaged) || 0,
      },
    }),
    prisma.blockStock.updateMany({
      where: { type: blockType },
      data: {
        available: { increment: Number(quantity) - Number(damaged || 0) },
        total: { increment: Number(quantity) },
      },
    }),
  ])

  return NextResponse.json(entry, { status: 201 })
}