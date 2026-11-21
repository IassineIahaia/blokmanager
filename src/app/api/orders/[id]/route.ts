import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { updateOrderSchema } from '@/lib/validation'

export const PATCH = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const { status } = await parseBody(req, updateOrderSchema)

  const order = await prisma.order.update({ where: { id }, data: { status } })
  return NextResponse.json(order)
})

export const DELETE = handler(async (_req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  await prisma.order.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
