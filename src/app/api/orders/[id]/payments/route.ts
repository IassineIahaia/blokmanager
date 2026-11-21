import { NextResponse } from 'next/server'
import { handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { adminPaymentSchema } from '@/lib/validation'
import { addAdminPayment } from '@/lib/orders'

/** Admin regista um pagamento recebido (fica confirmado de imediato). */
export const POST = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const data = await parseBody(req, adminPaymentSchema)
  const payment = await addAdminPayment(id, data)
  return NextResponse.json(payment, { status: 201 })
})
