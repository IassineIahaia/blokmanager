import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const orders = await prisma.order.findMany({
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { cliente, valor } = body

  if (!cliente || !valor) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
  }

  const order = await prisma.order.create({
    data: { cliente, valor: Number(valor), status: 'pendente' },
  })

  return NextResponse.json(order, { status: 201 })
}