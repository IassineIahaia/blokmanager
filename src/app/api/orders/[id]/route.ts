import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { status } = body

  const validStatuses = ['pendente', 'confirmado', 'entregue', 'cancelado']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(order)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await prisma.order.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}