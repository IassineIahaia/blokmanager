import { NextResponse } from 'next/server'
import { handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { reviewPaymentSchema } from '@/lib/validation'
import { reviewPayment } from '@/lib/orders'

/** Confirmar ou rejeitar um comprovativo enviado pelo cliente. */
export const PATCH = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const { action, note } = await parseBody(req, reviewPaymentSchema)
  const orderId = await reviewPayment(id, action, note)
  return NextResponse.json({ ok: true, orderId })
})
