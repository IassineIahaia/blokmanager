import { NextResponse } from 'next/server'
import { handler, parseBody } from '@/lib/api'
import { submitPaymentSchema } from '@/lib/validation'
import { submitCustomerPayment } from '@/lib/orders'

/** Público (protegido pelo token secreto do pedido): o cliente indica a referência do pagamento. */
export const POST = handler(async (req: Request, { params }: { params: Promise<{ token: string }> }) => {
  const { token } = await params
  const data = await parseBody(req, submitPaymentSchema)
  await submitCustomerPayment(token, data)
  return NextResponse.json({ ok: true }, { status: 201 })
})
