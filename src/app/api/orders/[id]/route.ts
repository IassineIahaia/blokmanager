import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { updateOrderSchema } from '@/lib/validation'
import { changeOrderStatus } from '@/lib/orders'
import { formatDate } from '@/lib/format'

export const GET = handler(async (_req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { type: true } } } },
      payments: { orderBy: { createdAt: 'desc' } },
      events: { orderBy: { createdAt: 'desc' } },
      driver: { select: { id: true, name: true } },
    },
  })
  if (!order) throw new ApiError(404, 'Encomenda não encontrada.')

  const drivers = await prisma.worker.findMany({
    where: { role: { contains: 'Motorista', mode: 'insensitive' } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ order, drivers })
})

/** Muda estado e/ou dados de entrega (motorista, data). */
export const PATCH = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const data = await parseBody(req, updateOrderSchema)

  if (data.driverId !== undefined || data.deliveryDate !== undefined) {
    if (data.driverId) {
      const driver = await prisma.worker.findUnique({ where: { id: data.driverId } })
      if (!driver) throw new ApiError(400, 'Motorista inválido.')
    }
    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(data.driverId !== undefined ? { driverId: data.driverId } : {}),
        ...(data.deliveryDate !== undefined ? { deliveryDate: data.deliveryDate } : {}),
      },
      include: { driver: { select: { name: true } } },
    })
    const parts = [
      data.driverId !== undefined && (order.driver ? `motorista ${order.driver.name}` : 'sem motorista'),
      data.deliveryDate !== undefined &&
        (order.deliveryDate ? `entrega prevista ${formatDate(order.deliveryDate)}` : 'sem data de entrega'),
    ].filter(Boolean)
    await prisma.orderEvent.create({
      data: { orderId: id, actor: 'admin', message: `Entrega actualizada: ${parts.join(', ')}.` },
    })
  }

  if (data.status) {
    await changeOrderStatus(id, data.status, 'admin', data.note)
  }

  const order = await prisma.order.findUniqueOrThrow({ where: { id } })
  return NextResponse.json(order)
})
