import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handler, parseBody, requireAdmin, type IdContext } from '@/lib/api'
import { zoneSchema } from '@/lib/validation'

export const PATCH = handler(async (req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  const data = await parseBody(req, zoneSchema.partial())
  const zone = await prisma.deliveryZone.update({ where: { id }, data })
  return NextResponse.json(zone)
})

/** As encomendas guardam o nome e a taxa da zona, por isso apagar não afecta o histórico. */
export const DELETE = handler(async (_req: Request, { params }: IdContext) => {
  await requireAdmin()
  const { id } = await params
  await prisma.deliveryZone.delete({ where: { id } })
  return NextResponse.json({ ok: true })
})
