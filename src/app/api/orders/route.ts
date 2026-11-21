import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { ApiError, handler, parseBody, requireAdmin } from '@/lib/api'
import { createOrderSchema, ORDER_STATUSES } from '@/lib/validation'
import { createOrder } from '@/lib/orders'
import { parseOrderCode } from '@/lib/format'

const PAGE_SIZE = 20

/** Lista com filtros: ?status=pendente&pagamento=em_verificacao&q=texto&page=1 */
export const GET = handler(async (req: Request) => {
  await requireAdmin()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const payment = url.searchParams.get('pagamento')
  const q = url.searchParams.get('q')?.trim()
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)

  const where: Prisma.OrderWhereInput = {}
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    where.status = status as (typeof ORDER_STATUSES)[number]
  }
  if (payment === 'por_pagar' || payment === 'em_verificacao' || payment === 'pago') {
    where.paymentStatus = payment
  }
  if (q) {
    const number = parseOrderCode(q)
    const digits = q.replace(/\D/g, '')
    where.OR = [
      { customerName: { contains: q, mode: 'insensitive' } },
      ...(digits.length >= 6 ? [{ customerPhone: { contains: digits } }] : []),
      ...(number !== null ? [{ number }] : []),
    ]
  }

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        customerName: true,
        customerPhone: true,
        zoneName: true,
        total: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
  ])

  const verifying = await prisma.order.count({
    where: { paymentStatus: 'em_verificacao', status: { not: 'cancelado' } },
  })

  return NextResponse.json({
    orders,
    total,
    page,
    pageSize: PAGE_SIZE,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
    verifying,
  })
})

/** Encomenda manual (balcão / telefone) com produtos reais. */
export const POST = handler(async (req: Request) => {
  await requireAdmin()
  const data = await parseBody(req, createOrderSchema)

  let zone: { name: string; fee: number } | null = null
  if (data.zoneId) {
    const z = await prisma.deliveryZone.findUnique({ where: { id: data.zoneId } })
    if (!z) throw new ApiError(400, 'Zona de entrega inválida.')
    zone = { name: z.name, fee: z.fee }
  }

  const order = await createOrder({
    items: data.items,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    zone,
    address: data.address,
    notes: data.notes,
    actor: 'admin',
  })

  return NextResponse.json(order, { status: 201 })
})
