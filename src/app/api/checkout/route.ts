import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, handler, parseBody } from '@/lib/api'
import { checkoutSchema } from '@/lib/validation'
import { createOrder } from '@/lib/orders'
import { orderCode } from '@/lib/format'

/** Público: cria a encomenda a partir do carrinho da loja. */
export const POST = handler(async (req: Request) => {
  const data = await parseBody(req, checkoutSchema)

  const zone = await prisma.deliveryZone.findFirst({ where: { id: data.zoneId, active: true } })
  if (!zone) throw new ApiError(400, 'Zona de entrega inválida.')

  const order = await createOrder({
    items: data.items,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    zone: { name: zone.name, fee: zone.fee },
    address: data.address,
    reference: data.reference,
    notes: data.notes,
    paymentMethod: data.paymentMethod,
    actor: 'cliente',
  })

  return NextResponse.json(
    { code: orderCode(order.number), token: order.accessToken, total: order.total },
    { status: 201 },
  )
})
