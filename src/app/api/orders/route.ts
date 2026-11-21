import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin } from '@/lib/api'
import { createOrderSchema } from '@/lib/validation'

export const GET = handler(async () => {
  await requireAdmin()
  const orders = await prisma.order.findMany({ orderBy: { date: 'desc' } })
  return NextResponse.json(orders)
})

export const POST = handler(async (req: Request) => {
  await requireAdmin()
  const { cliente, valor } = await parseBody(req, createOrderSchema)

  const order = await prisma.order.create({
    data: { cliente, valor, status: 'pendente' },
  })

  return NextResponse.json(order, { status: 201 })
})
