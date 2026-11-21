import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, handler, parseBody } from '@/lib/api'
import { trackOrderSchema } from '@/lib/validation'
import { parseOrderCode } from '@/lib/format'

/** Público: encontra o pedido pelo código + telefone e devolve o link privado. */
export const POST = handler(async (req: Request) => {
  const { code, phone } = await parseBody(req, trackOrderSchema)
  const number = parseOrderCode(code)

  const order =
    number !== null
      ? await prisma.order.findFirst({ where: { number, customerPhone: phone }, select: { accessToken: true } })
      : null

  // Mesma mensagem para código ou telefone errados (não revela se o pedido existe)
  if (!order) throw new ApiError(404, 'Não encontrámos nenhum pedido com esse código e telefone.')

  return NextResponse.json({ token: order.accessToken })
})
